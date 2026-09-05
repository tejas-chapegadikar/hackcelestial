import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTrustScore } from "@/lib/matching";
import { computeUtilization } from "@/lib/utilization";
import { getSeasonalInsight } from "@/lib/seasonal";
import { RESOURCE_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import { StarRating } from "@/components/Badges";
import { Card } from "@/components/ui";
import RequestForm from "@/components/RequestForm";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  // A single query: reviews are pulled in via the provider relation instead of
  // a second round-trip, since resolving `reviews.toId = resource.providerId`
  // separately would otherwise have to wait on this query's result first anyway.
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          city: true,
          businessType: true,
          phone: true,
          reviewsReceived: { select: { rating: true, onTime: true, conditionOk: true, punctual: true } },
        },
      },
      requests: { select: { startDate: true, endDate: true, status: true } },
    },
  });
  if (!resource) notFound();

  const trust = computeTrustScore(resource.provider.reviewsReceived);
  const isOwner = resource.providerId === session.user.id;
  const utilization = isOwner ? computeUtilization(resource.requests) : null;
  const seasonalInsight = isOwner ? getSeasonalInsight(resource.type, new Date().getMonth()) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">{RESOURCE_TYPE_LABELS[resource.type]}</div>
          <h1 className="text-2xl font-semibold text-gray-900">{resource.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {resource.city} · listed by{" "}
            <Link href={`/profile/${resource.providerId}`} className="text-teal-600 hover:text-teal-700 hover:underline">
              {resource.provider.name}
            </Link>
          </p>
        </div>

        {resource.description && <p className="text-gray-700">{resource.description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Price per item" value={`${formatCurrency(resource.pricePerUnit)}/${resource.unit.toLowerCase()}`} />
          <Stat label="Quantity available" value={String(resource.quantity)} />
          {resource.capacity != null && <Stat label="Capacity" value={String(resource.capacity)} />}
          <Stat label="Min. rental" value={`${resource.minRentalPeriod} ${resource.unit.toLowerCase()}(s)`} />
          {resource.depositAmount != null && (
            <Stat label="Refundable deposit" value={formatCurrency(resource.depositAmount)} />
          )}
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
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold text-sm text-gray-900">Your listing</h3>
            <p className="text-sm text-gray-600">
              {utilization.utilizationPct}% utilized over the last {utilization.windowDays} days
              {utilization.idle && (
                <span className="text-orange-600 font-medium"> — considered idle</span>
              )}
            </p>
            {seasonalInsight && (
              <p className="flex items-start gap-1.5 text-xs text-gray-600">
                <Lightbulb className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" strokeWidth={2} />
                {seasonalInsight}
              </p>
            )}
            <Link href={`/resources/${resource.id}/edit`} className="text-sm text-teal-600 font-medium hover:text-teal-700 hover:underline inline-block">
              Edit listing
            </Link>
          </Card>
        )}
      </div>

      <div>
        {!isOwner && resource.status === "ACTIVE" && (
          <RequestForm
            resourceId={resource.id}
            resource={{
              pricePerUnit: resource.pricePerUnit,
              unit: resource.unit,
              depositAmount: resource.depositAmount,
              quantity: resource.quantity,
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </Card>
  );
}
