import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkCompatibility, isAvailable, rankResources, computeTrustScore } from "@/lib/matching";

/**
 * For a bundle's abstract item needs, find candidate resources per item and
 * group providers by whether they can fulfill the *entire* bundle vs only part of it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bundle = await prisma.bundle.findUnique({ where: { id }, include: { items: true } });
  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bundle.seekerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const start = bundle.eventDate;
  const end = new Date(bundle.eventDate);
  end.setDate(end.getDate() + 1);

  const itemMatches: Record<
    string,
    { itemId: string; type: string; matches: { resourceId: string; providerId: string; providerName: string; title: string; score: number }[] }
  > = {};

  const providerCoverage = new Map<string, Set<string>>();
  const providerNames = new Map<string, string>();

  for (const item of bundle.items) {
    const candidates = await prisma.resource.findMany({
      where: { status: "ACTIVE", type: item.type },
      include: {
        unavailableRanges: true,
        requests: { select: { id: true, startDate: true, endDate: true, status: true } },
        provider: { select: { id: true, name: true } },
      },
    });

    const itemCriteria = {
      quantityNeeded: item.quantityNeeded,
      capacityNeeded: item.capacityNeeded ?? undefined,
      amenities: item.amenities,
    };
    const available = candidates.filter((c) => isAvailable(c, start, end));
    const compatible = available.filter(
      (c) => checkCompatibility(c, itemCriteria).compatible
    );

    const providerIds = [...new Set(compatible.map((c) => c.providerId))];
    const reviews = await prisma.review.findMany({
      where: { toId: { in: providerIds } },
      select: { toId: true, rating: true, onTime: true, conditionOk: true, punctual: true },
    });
    const trustScores = new Map(
      providerIds.map((pid) => [pid, computeTrustScore(reviews.filter((r) => r.toId === pid))])
    );

    const ranked = rankResources(
      compatible,
      {
        startDate: start,
        endDate: end,
        quantityNeeded: item.quantityNeeded,
        capacityNeeded: item.capacityNeeded ?? undefined,
        budget: item.budget ?? undefined,
        amenities: item.amenities,
      },
      trustScores
    );

    itemMatches[item.id] = {
      itemId: item.id,
      type: item.type,
      matches: ranked.map((r) => {
        const provider = (r.resource as unknown as { provider: { id: string; name: string } }).provider;
        providerNames.set(provider.id, provider.name);
        if (!providerCoverage.has(provider.id)) providerCoverage.set(provider.id, new Set());
        providerCoverage.get(provider.id)!.add(item.id);
        return {
          resourceId: r.resource.id,
          providerId: provider.id,
          providerName: provider.name,
          title: r.resource.title,
          score: r.score,
        };
      }),
    };
  }

  const totalItems = bundle.items.length;
  const fullFulfillment: { providerId: string; providerName: string; itemCount: number }[] = [];
  const partialFulfillment: { providerId: string; providerName: string; itemCount: number }[] = [];

  for (const [providerId, itemIds] of providerCoverage.entries()) {
    const entry = { providerId, providerName: providerNames.get(providerId) ?? "Unknown", itemCount: itemIds.size };
    if (itemIds.size === totalItems) fullFulfillment.push(entry);
    else partialFulfillment.push(entry);
  }

  fullFulfillment.sort((a, b) => b.itemCount - a.itemCount);
  partialFulfillment.sort((a, b) => b.itemCount - a.itemCount);

  return NextResponse.json({ itemMatches, fullFulfillment, partialFulfillment, totalItems });
}
