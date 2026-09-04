import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboardData";
import { RESOURCE_TYPE_LABELS } from "@/lib/utils";
import { StarRating } from "@/components/Badges";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboardData(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/resources/new"
            className="bg-teal-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-teal-700"
          >
            + List a resource
          </Link>
          <Link
            href="/resources"
            className="border border-gray-300 text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-100"
          >
            Find a resource
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending inbox" value={data.pendingInbox} sub={data.urgentInbox > 0 ? `${data.urgentInbox} urgent` : undefined} href="/requests?role=provider" />
        <StatCard label="My active requests" value={data.myActiveRequests} href="/requests?role=seeker" />
        <StatCard label="My bundles" value={data.myBundles} href="/bundles" />
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Trust score</div>
          {data.trust.count > 0 ? (
            <>
              <StarRating value={data.trust.avgRating} />
              <div className="text-xs text-gray-500 mt-1">{data.trust.count} review(s)</div>
            </>
          ) : (
            <div className="text-sm text-gray-500">No reviews yet</div>
          )}
        </div>
      </div>

      {data.pendingReviews.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="font-semibold text-amber-900 mb-2">Reviews to leave</h2>
          <ul className="space-y-1">
            {data.pendingReviews.map((r) => (
              <li key={r.id} className="text-sm">
                <Link href={`/requests/${r.id}`} className="text-teal-700 hover:underline">
                  Rate your experience with &quot;{r.resource.title}&quot;
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.idleAlerts.length > 0 && (
        <section className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h2 className="font-semibold text-orange-900 mb-2">Idle asset alerts</h2>
          <ul className="space-y-1">
            {data.idleAlerts.map((r) => (
              <li key={r.id} className="text-sm text-orange-900">
                <Link href={`/my-resources`} className="font-medium hover:underline">
                  {r.title}
                </Link>{" "}
                has been idle {30 - r.utilization.bookedDays} of the last 30 days ({r.utilization.utilizationPct}%
                utilization) — consider adjusting price or visibility.
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-3">My resources</h2>
        {data.myResources.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven&apos;t listed any resources yet.{" "}
            <Link href="/resources/new" className="text-teal-700 font-medium">
              List one now
            </Link>
            .
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.myResources.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/resources/${r.id}`} className="font-medium hover:underline">
                    {r.title}
                  </Link>
                  <span className="text-xs text-gray-500">{RESOURCE_TYPE_LABELS[r.type]}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {r.status === "INACTIVE" ? "Inactive · " : ""}
                  {r.utilization.utilizationPct}% utilized (30d)
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-teal-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, r.utilization.utilizationPct)}%` }}
                  />
                </div>
                {r.seasonalInsight && (
                  <p className="text-xs text-teal-700 mt-2">💡 {r.seasonalInsight}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-red-600 font-medium mt-1">{sub}</div>}
    </Link>
  );
}
