import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

const schema = z.object({
  type: z.enum(["MESSAGE", "QUOTE", "COUNTER"]),
  price: z.number().positive().optional(),
  message: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: { resource: { select: { providerId: true, title: true } } },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user.id;
  const isSeeker = request.seekerId === userId;
  const isProvider = request.resource.providerId === userId;
  if (!isSeeker && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (request.status !== "PENDING" && request.status !== "COUNTERED") {
    return NextResponse.json({ error: `Cannot negotiate a ${request.status} request` }, { status: 409 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const message = await prisma.$transaction(async (tx) => {
    const m = await tx.negotiationMessage.create({
      data: { requestId: id, senderId: userId, type: data.type, price: data.price, message: data.message },
    });
    if (data.type === "QUOTE" || data.type === "COUNTER") {
      await tx.request.update({ where: { id }, data: { status: "COUNTERED" } });
    }
    return m;
  });

  const otherPartyId = isSeeker ? request.resource.providerId : request.seekerId;
  await notify(
    otherPartyId,
    "NEGOTIATION_UPDATE",
    `New ${data.type.toLowerCase()} on request for "${request.resource.title}"`,
    `/requests/${id}`
  );

  return NextResponse.json(message, { status: 201 });
}
