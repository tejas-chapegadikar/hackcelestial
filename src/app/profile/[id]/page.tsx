import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTrustScore } from "@/lib/matching";
import { BUSINESS_TYPE_LABELS, RESOURCE_TYPE_LABELS } from "@/lib/utils";
import { StarRating } from "@/components/Badges";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  if (id === session.user.id) redirect("/profile");

  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) notFound();

  const resources = await prisma.resource.findMany({
    where: { providerId: business.id, status: "ACTIVE" },
    select: { id: true, title: true, type: true },
  });

  const reviews = await prisma.review.findMany({
    where: { toId: business.id },
    include: { from: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const trust = computeTrustScore(reviews);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">{business.name}</h1>
        <p className="text-sm text-gray-600">
          {BUSINESS_TYPE_LABELS[business.businessType]} · {business.city}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {trust.count > 0 ? (
            <>
              <StarRating value={trust.avgRating} />
              <span className="text-xs text-gray-500">
                {trust.avgRating.toFixed(1)} · {trust.count} review{trust.count !== 1 ? "s" : ""} · On-time{" "}
                {Math.round(trust.onTimeRate * 100)}%
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-500">No reviews yet</span>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-sm mb-2">Listed resources</h2>
        {resources.length === 0 ? (
          <p className="text-sm text-gray-500">No active listings.</p>
        ) : (
          <ul className="space-y-1">
            {resources.map((r) => (
              <li key={r.id} className="text-sm">
                <Link href={`/resources/${r.id}`} className="text-teal-700 hover:underline">
                  {r.title}
                </Link>{" "}
                <span className="text-gray-500">({RESOURCE_TYPE_LABELS[r.type]})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {reviews.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">Reviews</h2>
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} />
                  <span className="text-xs text-gray-500">from {r.from.name}</span>
                </div>
                {r.comment && <p className="text-gray-700 mt-1">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
