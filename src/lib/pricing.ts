import { prisma } from "@/lib/prisma";
import type { ResourceType } from "@prisma/client";

export type PriceBenchmark = {
  min: number;
  max: number;
  avg: number;
  sampleSize: number;
  scope: "city" | "all";
};

/** Avg/min/max price for the same resource type, preferring same-city samples. */
export async function getPriceBenchmark(
  type: ResourceType,
  city: string
): Promise<PriceBenchmark | null> {
  const cityMatches = await prisma.resource.findMany({
    where: { type, city, status: "ACTIVE" },
    select: { pricePerUnit: true },
  });

  const pool = cityMatches.length >= 3 ? cityMatches : null;
  const scope: "city" | "all" = pool ? "city" : "all";

  const samples =
    pool ??
    (await prisma.resource.findMany({
      where: { type, status: "ACTIVE" },
      select: { pricePerUnit: true },
    }));

  if (samples.length === 0) return null;

  const prices = samples.map((s) => s.pricePerUnit);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    sampleSize: prices.length,
    scope,
  };
}
