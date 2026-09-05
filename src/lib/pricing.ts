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

/** Flat platform surcharge applied to the opening ask when a request is marked urgent. */
export const URGENT_SURCHARGE_RATE = 0.25;

export type Quote = {
  units: number;
  basePrice: number;
  urgentSurchargePct: number;
  surchargeAmount: number;
  totalPrice: number;
};

/**
 * Opening price for a request: the resource's normal rate times the booking length and
 * quantity, plus a flat surcharge if the request is urgent. Advance bookings pay the
 * normal rate; same-day/urgent ones pay more — the negotiation thread can still move
 * the price from there.
 */
export function computeQuote(
  resource: { pricePerUnit: number; unit: "HOUR" | "DAY" },
  params: { startDate: Date; endDate: Date; quantityNeeded: number; urgent: boolean }
): Quote {
  const unitMs = resource.unit === "HOUR" ? 1000 * 60 * 60 : 1000 * 60 * 60 * 24;
  const units = Math.max(1, Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / unitMs));
  const basePrice = resource.pricePerUnit * units * Math.max(1, params.quantityNeeded);
  const urgentSurchargePct = params.urgent ? URGENT_SURCHARGE_RATE : 0;
  const surchargeAmount = basePrice * urgentSurchargePct;
  return { units, basePrice, urgentSurchargePct, surchargeAmount, totalPrice: basePrice + surchargeAmount };
}
