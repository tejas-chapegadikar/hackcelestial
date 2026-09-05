import { redirect } from "next/navigation";
import Link from "next/link";
import { Lightbulb, Plus, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboardData";
import { RESOURCE_TYPE_LABELS } from "@/lib/utils";
import { StarRating, TypeIcon } from "@/components/Badges";
import { Card, buttonClasses } from "@/components/ui";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboardData(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/resources/new" className={buttonClasses("primary")}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            List a resource
          </Link>
          <Link href="/resources" className={buttonClasses("secondary")}>
            <Search className="w-4 h-4" strokeWidth={2} />
            Find a resource
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending inbox" value={data.pendingInbox} sub={data.urgentInbox > 0 ? `${data.urgentInbox} urgent` : undefined} href="/requests?role=provider" />
        <StatCard label="My active requests" value={data.myActiveRequests} href="/requests?role=seeker" />
        <StatCard label="My bundles" value={data.myBundles} href="/bundles" />
        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">Trust score</div>
          {data.trust.count > 0 ? (
            <>
              <StarRating value={data.trust.avgRating} />
              <div className="text-xs text-gray-500 mt-1">{data.trust.count} review(s)</div>
            </>
          ) : (
            <div className="text-sm text-gray-400">No reviews yet</div>
          )}
        </Card>
      </div>

      {data.pendingReviews.length > 0 && (
        <section className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <h2 className="font-semibold text-amber-900 mb-2">Reviews to leave</h2>
          <ul className="space-y-1">
            {data.pendingReviews.map((r) => (
              <li key={r.id} className="text-sm">
                <Link href={`/requests/${r.id}`} className="text-amber-900 hover:underline">
                  Rate your experience with &quot;{r.resource.title}&quot;
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.idleAlerts.length > 0 && (
        <section className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
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
        <h2 className="font-semibold text-gray-900 mb-3">My resources</h2>
        {data.myResources.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven&apos;t listed any resources yet.{" "}
            <Link href="/resources/new" className="text-teal-600 font-medium hover:text-teal-700">
              List one now
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.myResources.map((r) => (
              <Card key={r.id} interactive className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <TypeIcon type={r.type} size="sm" />
                  <div className="min-w-0">
                    <Link href={`/resources/${r.id}`} className="font-medium text-gray-900 hover:underline block truncate">
                      {r.title}
                    </Link>
                    <span className="text-xs text-gray-500">{RESOURCE_TYPE_LABELS[r.type]}</span>
                  </div>
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
                  <p className="flex items-start gap-1 text-xs text-gray-600 mt-2">
                    <Lightbulb className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" strokeWidth={2} />
                    {r.seasonalInsight}
                  </p>
                )}
              </Card>
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
    <Link href={href} className="block bg-white border border-gray-200/80 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-4 transition-all duration-150 hover:border-teal-200 hover:shadow-[0_8px_24px_-4px_rgba(13,148,136,0.12)]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-red-600 font-medium mt-1">{sub}</div>}
    </Link>
  );
}
