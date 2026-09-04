import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAvailable, rankResources, computeTrustScore } from "@/lib/matching";

const RESOURCE_TYPES = [
  "BANQUET_SPACE",
  "PARKING",
  "VEHICLE",
  "KITCHEN",
  "FURNITURE",
  "AV_EQUIPMENT",
  "OTHER",
] as const;

const createSchema = z.object({
  type: z.enum(RESOURCE_TYPES),
  title: z.string().min(2),
  description: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  capacity: z.number().int().positive().optional(),
  unit: z.enum(["HOUR", "DAY"]).default("DAY"),
  pricePerUnit: z.number().positive(),
  minRentalPeriod: z.number().int().positive().default(1),
  amenities: z.array(z.string()).default([]),
  city: z.string().min(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
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

  const resource = await prisma.resource.create({
    data: { ...parsed.data, providerId: session.user.id },
  });

  return NextResponse.json(resource, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const quantityNeeded = searchParams.get("quantityNeeded");
  const capacityNeeded = searchParams.get("capacityNeeded");
  const budget = searchParams.get("budget");
  const amenities = searchParams.getAll("amenities");
  const providerId = searchParams.get("providerId") ?? undefined;
  const enforceMinRental = searchParams.get("enforceMinRental") !== "false";

  const resources = await prisma.resource.findMany({
    where: {
      status: "ACTIVE",
      ...(type ? { type: type as (typeof RESOURCE_TYPES)[number] } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(providerId ? { providerId } : {}),
    },
    include: {
      unavailableRanges: true,
      requests: { select: { id: true, startDate: true, endDate: true, status: true } },
      provider: { select: { id: true, name: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!startDate || !endDate) {
    return NextResponse.json({ results: resources.map((r) => ({ resource: r })) });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const available = resources.filter((r) => isAvailable(r, start, end));

  const providerIds = [...new Set(available.map((r) => r.providerId))];
  const reviews = await prisma.review.findMany({
    where: { toId: { in: providerIds } },
    select: { toId: true, rating: true, onTime: true, conditionOk: true, punctual: true },
  });
  const trustScores = new Map(
    providerIds.map((id) => [
      id,
      computeTrustScore(reviews.filter((r) => r.toId === id)),
    ])
  );

  let ranked = rankResources(
    available,
    {
      type,
      city,
      startDate: start,
      endDate: end,
      quantityNeeded: quantityNeeded ? Number(quantityNeeded) : undefined,
      capacityNeeded: capacityNeeded ? Number(capacityNeeded) : undefined,
      budget: budget ? Number(budget) : undefined,
      amenities: amenities.length ? amenities : undefined,
    },
    trustScores
  );

  if (enforceMinRental) {
    ranked = ranked.filter((r) => r.minRental.ok);
  }

  const results = ranked.map((r) => {
    const full = r.resource as typeof r.resource & {
      unavailableRanges: unknown;
      requests: unknown;
      provider: { id: string; name: string; city: string };
    };
    const { unavailableRanges, requests, provider, ...resource } = full;
    void unavailableRanges;
    void requests;
    return {
      resource,
      provider,
      score: r.score,
      distanceKm: r.distanceKm,
      compatibility: r.compatibility,
      minRental: r.minRental,
      trust: trustScores.get(r.resource.providerId),
    };
  });

  return NextResponse.json({ results });
}
