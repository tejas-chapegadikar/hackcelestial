import { redirect } from "next/navigation";
import Link from "next/link";
import { Lightbulb, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUtilization } from "@/lib/utilization";
import { getSeasonalInsight } from "@/lib/seasonal";
import { RESOURCE_TYPE_LABELS, formatCurrency, cn } from "@/lib/utils";
import { TypeIcon } from "@/components/Badges";
import { buttonClasses, cardClasses } from "@/components/ui";

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
        <h1 className="text-2xl font-semibold text-gray-900">My resources</h1>
        <Link href="/resources/new" className={buttonClasses("primary")}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          List a resource
        </Link>
      </div>

      {resources.length === 0 && (
        <p className="text-sm text-gray-500">You haven&apos;t listed any resources yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {resources.map((r) => {
          const utilization = computeUtilization(r.requests);
          const insight = getSeasonalInsight(r.type, new Date().getMonth());
          return (
            <Link key={r.id} href={`/resources/${r.id}`} className={`${cardClasses(true)} p-4 space-y-2`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <TypeIcon type={r.type} />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{r.title}</div>
                    <div className="text-xs text-gray-500">{RESOURCE_TYPE_LABELS[r.type]} · {r.city}</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border shrink-0",
                    r.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
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
                  <span className={utilization.idle ? "text-orange-600 font-medium" : ""}>
                    {utilization.utilizationPct}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={cn("h-1.5 rounded-full", utilization.idle ? "bg-orange-400" : "bg-teal-500")}
                    style={{ width: `${Math.min(100, utilization.utilizationPct)}%` }}
                  />
                </div>
              </div>
              {insight && (
                <p className="flex items-start gap-1 text-xs text-gray-600">
                  <Lightbulb className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" strokeWidth={2} />
                  {insight}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
