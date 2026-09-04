"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { RESOURCE_TYPE_LABELS, formatDate, cn } from "@/lib/utils";
import { RequestStatusBadge, UrgentBadge } from "@/components/Badges";

type RequestRow = {
  id: string;
  status: string;
  urgent: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
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
        <h1 className="text-2xl font-semibold">Requests</h1>
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => router.push("/requests?role=seeker")}
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-md",
              role === "seeker" ? "bg-white shadow-sm" : "text-gray-600"
            )}
          >
            My requests
          </button>
          <button
            onClick={() => router.push("/requests?role=provider")}
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-md",
              role === "provider" ? "bg-white shadow-sm" : "text-gray-600"
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
          <Link
            key={r.id}
            href={`/requests/${r.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {r.resource.title}
                  {r.urgent && <UrgentBadge />}
                </div>
                <div className="text-xs text-gray-500">
                  {RESOURCE_TYPE_LABELS[r.resource.type]} · {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  {role === "provider" && r.seeker && <> · from {r.seeker.name}</>}
                </div>
              </div>
              <RequestStatusBadge status={r.status} />
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
