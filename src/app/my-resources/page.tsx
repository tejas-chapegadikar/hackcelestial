import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUtilization } from "@/lib/utilization";
import { getSeasonalInsight } from "@/lib/seasonal";
import { RESOURCE_TYPE_LABELS, formatCurrency, cn } from "@/lib/utils";
import { TypeIcon } from "@/components/Badges";

export default async function MyResourcesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resources = await prisma.resource.findMany({
    where: { providerId: session.user.id },
    include: { requests: { select: { startDate: true, endDate: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My resources</h1>
        <Link
          href="/resources/new"
          className="bg-gray-900 text-white text-sm font-medium px-3 py-2 rounded-full hover:bg-gray-800"
        >
          + List a resource
        </Link>
      </div>

      {resources.length === 0 && (
        <p className="text-sm text-gray-500">You haven&apos;t listed any resources yet.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((r) => {
          const utilization = computeUtilization(r.requests);
          const insight = getSeasonalInsight(r.type, new Date().getMonth());
          return (
            <Link
              key={r.id}
              href={`/resources/${r.id}`}
              className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <TypeIcon type={r.type} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-xs text-gray-500">{RESOURCE_TYPE_LABELS[r.type]} · {r.city}</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    r.status === "ACTIVE"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  )}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(r.pricePerUnit)}/{r.unit.toLowerCase()}
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Utilization (30d)</span>
                  <span className={utilization.idle ? "text-orange-700 font-medium" : ""}>
                    {utilization.utilizationPct}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={cn("h-1.5 rounded-full", utilization.idle ? "bg-orange-400" : "bg-gray-900")}
                    style={{ width: `${Math.min(100, utilization.utilizationPct)}%` }}
                  />
                </div>
              </div>
              {insight && <p className="text-xs text-gray-900">💡 {insight}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
