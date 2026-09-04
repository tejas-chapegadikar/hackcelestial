import type { Request as ResourceRequest } from "@prisma/client";

export type UtilizationStats = {
  bookedDays: number;
  windowDays: number;
  utilizationPct: number;
  idle: boolean;
};

const IDLE_THRESHOLD_PCT = 20;
const WINDOW_DAYS = 30;

/** Booked-days ÷ last-30-days for one resource, from its accepted/completed requests. */
export function computeUtilization(
  requests: Pick<ResourceRequest, "startDate" | "endDate" | "status">[],
  now: Date = new Date()
): UtilizationStats {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);

  let bookedMs = 0;
  for (const req of requests) {
    if (req.status !== "ACCEPTED" && req.status !== "COMPLETED") continue;
    const start = req.startDate > windowStart ? req.startDate : windowStart;
    const end = req.endDate < now ? req.endDate : now;
    if (end > start) bookedMs += end.getTime() - start.getTime();
  }

  const bookedDays = Math.round(bookedMs / (1000 * 60 * 60 * 24));
  const utilizationPct = Math.round((bookedDays / WINDOW_DAYS) * 100);

  return {
    bookedDays,
    windowDays: WINDOW_DAYS,
    utilizationPct,
    idle: utilizationPct < IDLE_THRESHOLD_PCT,
  };
}
