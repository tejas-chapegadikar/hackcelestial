"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { RESOURCE_TYPE_LABELS, formatCurrency, formatDate, cn } from "@/lib/utils";
import { RequestStatusBadge, UrgentBadge } from "@/components/Badges";
import { cardClasses } from "@/components/ui";

type RequestRow = {
  id: string;
  status: string;
  urgent: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  totalPrice: number | null;
  resource: { id: string; title: string; type: string };
  seeker?: { id: string; name: string; city: string };
};

function RequestsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") === "provider" ? "provider" : "seeker";
  const [requests, setRequests] = useState<RequestRow[] | null>(null);
  const loadSeq = useRef(0);

  useEffect(() => {
    const seq = ++loadSeq.current;
    setRequests(null);
    fetch(`/api/requests?role=${role}`)
      .then((r) => r.json())
      .then((d) => {
        if (seq === loadSeq.current) setRequests(d.requests ?? []);
      });
  }, [role]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => router.push("/requests?role=seeker")}
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
              role === "seeker" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}
          >
            My requests
          </button>
          <button
            onClick={() => router.push("/requests?role=provider")}
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
              role === "provider" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Inbox
          </button>
        </div>
      </div>

      {requests === null && <p className="text-sm text-gray-500">Loading...</p>}
      {requests?.length === 0 && <p className="text-sm text-gray-500">No requests here yet.</p>}

      <div className="space-y-2">
        {requests?.map((r) => (
          <Link key={r.id} href={`/requests/${r.id}`} className={`block ${cardClasses(true)} p-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {r.resource.title}
                  {r.urgent && <UrgentBadge />}
                </div>
                <div className="text-xs text-gray-500">
                  {RESOURCE_TYPE_LABELS[r.resource.type]} · {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  {role === "provider" && r.seeker && <> · from {r.seeker.name}</>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {r.totalPrice != null && (
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(r.totalPrice)}</span>
                )}
                <RequestStatusBadge status={r.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <RequestsInner />
    </Suspense>
  );
}
