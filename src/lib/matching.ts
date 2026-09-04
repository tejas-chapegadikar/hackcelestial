import type { Resource, UnavailableRange, Request } from "@prisma/client";
import { distanceKm } from "@/lib/utils";

export type SearchCriteria = {
  type?: string;
  city?: string;
  startDate: Date;
  endDate: Date;
  quantityNeeded?: number;
  capacityNeeded?: number;
  budget?: number;
  amenities?: string[];
  lat?: number | null;
  lng?: number | null;
};

export type CompatibilityResult = {
  compatible: boolean;
  reasons: string[];
};

/** Resource fit against what the seeker actually needs — not just "does it exist". */
export function checkCompatibility(
  resource: Resource,
  criteria: Pick<SearchCriteria, "quantityNeeded" | "capacityNeeded" | "amenities">
): CompatibilityResult {
  const reasons: string[] = [];

  if (criteria.quantityNeeded && criteria.quantityNeeded > resource.quantity) {
    reasons.push(
      `Only ${resource.quantity} available, you need ${criteria.quantityNeeded}`
    );
  }

  if (
    criteria.capacityNeeded &&
    resource.capacity != null &&
    criteria.capacityNeeded > resource.capacity
  ) {
    reasons.push(
      `Capacity is ${resource.capacity}, you need ${criteria.capacityNeeded}`
    );
  }

  if (criteria.amenities && criteria.amenities.length > 0) {
    const missing = criteria.amenities.filter(
      (a) => !resource.amenities.some((ra) => ra.toLowerCase() === a.toLowerCase())
    );
    if (missing.length > 0) {
      reasons.push(`Missing: ${missing.join(", ")}`);
    }
  }

  return { compatible: reasons.length === 0, reasons };
}

export type MinRentalResult = {
  ok: boolean;
  reason?: string;
};

/** Flags requests shorter than the provider's stated minimum rental period. */
export function checkMinRentalPeriod(
  resource: Resource,
  startDate: Date,
  endDate: Date
): MinRentalResult {
  const unitMs = resource.unit === "HOUR" ? 1000 * 60 * 60 : 1000 * 60 * 60 * 24;
  const units = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / unitMs));

  if (units < resource.minRentalPeriod) {
    return {
      ok: false,
      reason: `Minimum rental is ${resource.minRentalPeriod} ${resource.unit.toLowerCase()}(s), you requested ${units}`,
    };
  }
  return { ok: true };
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart < bEnd && bStart < aEnd;
}

/** True if the resource has no blocked range or conflicting accepted booking over [start, end]. */
export function isAvailable(
  resource: Resource & {
    unavailableRanges: UnavailableRange[];
    requests: Pick<Request, "id" | "startDate" | "endDate" | "status">[];
  },
  startDate: Date,
  endDate: Date,
  excludeRequestId?: string
) {
  for (const range of resource.unavailableRanges) {
    if (rangesOverlap(startDate, endDate, range.startDate, range.endDate)) {
      return false;
    }
  }
  for (const req of resource.requests) {
    if (req.id === excludeRequestId) continue;
    if (req.status !== "ACCEPTED" && req.status !== "COUNTERED") continue;
    if (rangesOverlap(startDate, endDate, req.startDate, req.endDate)) {
      return false;
    }
  }
  return true;
}

export type TrustStats = {
  avgRating: number;
  onTimeRate: number;
  conditionRate: number;
  punctualRate: number;
  count: number;
};

export function computeTrustScore(
  reviews: { rating: number; onTime: boolean; conditionOk: boolean; punctual: boolean }[]
): TrustStats {
  if (reviews.length === 0) {
    return { avgRating: 0, onTimeRate: 0, conditionRate: 0, punctualRate: 0, count: 0 };
  }
  const count = reviews.length;
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / count;
  const onTimeRate = reviews.filter((r) => r.onTime).length / count;
  const conditionRate = reviews.filter((r) => r.conditionOk).length / count;
  const punctualRate = reviews.filter((r) => r.punctual).length / count;
  return { avgRating, onTimeRate, conditionRate, punctualRate, count };
}

/** 0-1 composite trust score used as a ranking input; neutral (0.6) for unrated providers. */
export function trustScoreValue(stats: TrustStats) {
  if (stats.count === 0) return 0.6;
  const ratingComponent = stats.avgRating / 5;
  const reliabilityComponent =
    (stats.onTimeRate + stats.conditionRate + stats.punctualRate) / 3;
  return ratingComponent * 0.6 + reliabilityComponent * 0.4;
}

export type RankedResource = {
  resource: Resource;
  score: number;
  priceFit: number;
  distanceKm: number | null;
  compatibility: CompatibilityResult;
  minRental: MinRentalResult;
};

/**
 * Scores resources that already passed availability filtering. Higher is better.
 * price closer to budget, closer distance, tighter capacity fit (less waste),
 * and provider trust all push score up.
 */
export function rankResources(
  resources: Resource[],
  criteria: SearchCriteria,
  trustScores: Map<string, TrustStats>
): RankedResource[] {
  return resources
    .map((resource) => {
      const compatibility = checkCompatibility(resource, criteria);
      const minRental = checkMinRentalPeriod(resource, criteria.startDate, criteria.endDate);

      const priceFit = criteria.budget
        ? Math.max(0, 1 - Math.abs(resource.pricePerUnit - criteria.budget) / criteria.budget)
        : 0.5;

      let dist: number | null = null;
      let distanceFit = 0.5;
      if (
        criteria.lat != null &&
        criteria.lng != null &&
        resource.lat != null &&
        resource.lng != null
      ) {
        dist = distanceKm(criteria.lat, criteria.lng, resource.lat, resource.lng);
        distanceFit = Math.max(0, 1 - dist / 100);
      }

      let capacityFit = 0.7;
      if (criteria.capacityNeeded && resource.capacity) {
        capacityFit =
          resource.capacity >= criteria.capacityNeeded
            ? Math.max(0.3, 1 - (resource.capacity - criteria.capacityNeeded) / resource.capacity)
            : 0;
      }

      const trust = trustScores.get(resource.providerId);
      const trustValue = trust ? trustScoreValue(trust) : 0.6;

      const score =
        priceFit * 0.3 + distanceFit * 0.2 + capacityFit * 0.25 + trustValue * 0.25;

      return { resource, score, priceFit, distanceKm: dist, compatibility, minRental };
    })
    .sort((a, b) => b.score - a.score);
}
