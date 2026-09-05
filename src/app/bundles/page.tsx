import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, RESOURCE_TYPE_LABELS } from "@/lib/utils";
import { buttonClasses, cardClasses } from "@/components/ui";

export default async function BundlesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bundles = await prisma.bundle.findMany({
    where: { seekerId: session.user.id },
    include: { items: true, requests: { select: { id: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Event bundles</h1>
        <Link href="/bundles/new" className={buttonClasses("primary")}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New bundle
        </Link>
      </div>
      <p className="text-sm text-gray-600">
        Need multiple resources for one event — a hall, parking, AV — from possibly different
        providers? Build a bundle and we&apos;ll match providers who can cover the whole thing, or
        just part of it.
      </p>

      {bundles.length === 0 && <p className="text-sm text-gray-500">No bundles yet.</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {bundles.map((b) => (
          <Link key={b.id} href={`/bundles/${b.id}`} className={`${cardClasses(true)} p-4`}>
            <div className="font-medium text-gray-900">{b.title}</div>
            <div className="text-xs text-gray-500 mb-2">
              {b.city} · Event on {formatDate(b.eventDate)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {b.items.map((i) => (
                <span key={i.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {RESOURCE_TYPE_LABELS[i.type]}
                </span>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">{b.requests.length} request(s) sent</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
