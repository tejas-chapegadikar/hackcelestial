import { prisma } from "@/lib/prisma";
import { computeUtilization } from "@/lib/utilization";
import { getSeasonalInsight } from "@/lib/seasonal";
import { computeTrustScore } from "@/lib/matching";

export async function getDashboardData(userId: string) {
  const now = new Date();

  const [resources, inboxRequests, myActiveRequests, myBundles, reviews, pendingReviews] = await Promise.all([
    prisma.resource.findMany({
      where: { providerId: userId },
      include: { requests: { select: { startDate: true, endDate: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.request.findMany({
      where: { resource: { providerId: userId }, status: { in: ["PENDING", "COUNTERED"] } },
      select: { urgent: true },
    }),
    prisma.request.count({
      where: { seekerId: userId, status: { in: ["PENDING", "COUNTERED", "ACCEPTED"] } },
    }),
    prisma.bundle.count({ where: { seekerId: userId } }),
    prisma.review.findMany({
      where: { toId: userId },
      select: { rating: true, onTime: true, conditionOk: true, punctual: true },
    }),
    prisma.request.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ seekerId: userId }, { resource: { providerId: userId } }],
        reviews: { none: { fromId: userId } },
      },
      select: { id: true, resource: { select: { title: true } } },
      take: 10,
    }),
  ]);

  const myResources = resources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    status: r.status,
    utilization: computeUtilization(r.requests, now),
    seasonalInsight: getSeasonalInsight(r.type, now.getMonth()),
  }));

  const idleAlerts = myResources.filter((r) => r.status === "ACTIVE" && r.utilization.idle);
  const pendingInbox = inboxRequests.length;
  const urgentInbox = inboxRequests.filter((r) => r.urgent).length;
  const trust = computeTrustScore(reviews);

  return {
    myResources,
    idleAlerts,
    pendingInbox,
    urgentInbox,
    myActiveRequests,
    myBundles,
    trust,
    pendingReviews,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
