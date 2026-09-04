import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkCompatibility, checkMinRentalPeriod, isAvailable } from "@/lib/matching";
import { notify } from "@/lib/notifications";

const createSchema = z.object({
  resourceId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  quantityNeeded: z.number().int().positive().default(1),
  capacityNeeded: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
  urgent: z.boolean().default(false),
  bundleId: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const resource = await prisma.resource.findUnique({
    where: { id: data.resourceId },
    include: {
      unavailableRanges: true,
      requests: { select: { id: true, startDate: true, endDate: true, status: true } },
    },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  if (resource.providerId === session.user.id) {
    return NextResponse.json({ error: "Cannot request your own resource" }, { status: 400 });
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (!isAvailable(resource, start, end)) {
    return NextResponse.json({ error: "Resource is not available for those dates" }, { status: 409 });
  }

  const compatibility = checkCompatibility(resource, data);
  if (!compatibility.compatible) {
    return NextResponse.json(
      { error: "Resource does not meet requirements", reasons: compatibility.reasons },
      { status: 422 }
    );
  }

  const minRental = checkMinRentalPeriod(resource, start, end);
  if (!minRental.ok) {
    return NextResponse.json({ error: minRental.reason }, { status: 422 });
  }

  const request = await prisma.request.create({
    data: {
      seekerId: session.user.id,
      resourceId: data.resourceId,
      bundleId: data.bundleId,
      startDate: start,
      endDate: end,
      quantityNeeded: data.quantityNeeded,
      capacityNeeded: data.capacityNeeded,
      budget: data.budget,
      urgent: data.urgent,
    },
  });

  if (data.message) {
    await prisma.negotiationMessage.create({
      data: {
        requestId: request.id,
        senderId: session.user.id,
        type: "MESSAGE",
        message: data.message,
      },
    });
  }

  await notify(
    resource.providerId,
    data.urgent ? "URGENT_REQUEST" : "NEW_REQUEST",
    `${data.urgent ? "🔴 Urgent: " : ""}New request for "${resource.title}"`,
    `/requests/${request.id}`
  );

  return NextResponse.json(request, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "seeker";

  if (role === "provider") {
    const requests = await prisma.request.findMany({
      where: { resource: { providerId: session.user.id } },
      include: {
        resource: { select: { id: true, title: true, type: true } },
        seeker: { select: { id: true, name: true, city: true } },
      },
      orderBy: [{ urgent: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ requests });
  }

  const requests = await prisma.request.findMany({
    where: { seekerId: session.user.id },
    include: {
      resource: { select: { id: true, title: true, type: true } },
    },
    orderBy: [{ urgent: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ requests });
}
