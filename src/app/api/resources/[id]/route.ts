import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeTrustScore } from "@/lib/matching";
import { computeUtilization } from "@/lib/utilization";
import { getSeasonalInsight } from "@/lib/seasonal";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      provider: { select: { id: true, name: true, city: true, businessType: true } },
      unavailableRanges: true,
      requests: { select: { id: true, startDate: true, endDate: true, status: true } },
    },
  });

  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { toId: resource.providerId },
    select: { rating: true, onTime: true, conditionOk: true, punctual: true },
  });
  const trust = computeTrustScore(reviews);
  const utilization = computeUtilization(resource.requests);
  const seasonalInsight = getSeasonalInsight(resource.type, new Date().getMonth());

  return NextResponse.json({ resource, trust, utilization, seasonalInsight });
}

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  unit: z.enum(["HOUR", "DAY"]).optional(),
  pricePerUnit: z.number().positive().optional(),
  minRentalPeriod: z.number().int().positive().optional(),
  amenities: z.array(z.string()).optional(),
  city: z.string().min(2).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (resource.providerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (resource.providerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
