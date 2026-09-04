import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTrustScore } from "@/lib/matching";
import { computeUtilization } from "@/lib/utilization";
import { getSeasonalInsight } from "@/lib/seasonal";
import { RESOURCE_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import { StarRating } from "@/components/Badges";
import RequestForm from "@/components/RequestForm";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      provider: { select: { id: true, name: true, city: true, businessType: true } },
      requests: { select: { startDate: true, endDate: true, status: true } },
    },
  });
  if (!resource) notFound();

  const reviews = await prisma.review.findMany({
    where: { toId: resource.providerId },
    select: { rating: true, onTime: true, conditionOk: true, punctual: true },
  });
  const trust = computeTrustScore(reviews);
  const isOwner = resource.providerId === session.user.id;
  const utilization = isOwner ? computeUtilization(resource.requests) : null;
  const seasonalInsight = isOwner ? getSeasonalInsight(resource.type, new Date().getMonth()) : null;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">{RESOURCE_TYPE_LABELS[resource.type]}</div>
          <h1 className="text-2xl font-semibold">{resource.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {resource.city} · listed by{" "}
            <Link href={`/profile/${resource.providerId}`} className="text-teal-700 hover:underline">
              {resource.provider.name}
            </Link>
          </p>
        </div>

        {resource.description && <p className="text-gray-700">{resource.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Price" value={`${formatCurrency(resource.pricePerUnit)}/${resource.unit.toLowerCase()}`} />
          <Stat label="Quantity" value={String(resource.quantity)} />
          {resource.capacity != null && <Stat label="Capacity" value={String(resource.capacity)} />}
          <Stat label="Min. rental" value={`${resource.minRentalPeriod} ${resource.unit.toLowerCase()}(s)`} />
        </div>

        {resource.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.amenities.map((a) => (
              <span key={a} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {trust.count > 0 ? (
            <>
              <StarRating value={trust.avgRating} />
              <span className="text-xs text-gray-500">
                {trust.avgRating.toFixed(1)} ({trust.count} review{trust.count !== 1 ? "s" : ""})
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-500">No reviews yet</span>
          )}
        </div>

        {isOwner && utilization && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Your listing</h3>
            <p className="text-sm text-gray-600">
              {utilization.utilizationPct}% utilized over the last {utilization.windowDays} days
              {utilization.idle && (
                <span className="text-orange-700 font-medium"> — considered idle</span>
              )}
            </p>
            {seasonalInsight && <p className="text-xs text-teal-700">💡 {seasonalInsight}</p>}
            <Link href={`/resources/${resource.id}/edit`} className="text-sm text-teal-700 font-medium hover:underline">
              Edit listing
            </Link>
          </div>
        )}
      </div>

      <div>{!isOwner && resource.status === "ACTIVE" && <RequestForm resourceId={resource.id} />}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
