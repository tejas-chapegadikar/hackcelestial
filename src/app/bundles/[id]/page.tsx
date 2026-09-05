"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RESOURCE_TYPE_LABELS, formatDate } from "@/lib/utils";
import { Button, Card } from "@/components/ui";

type BundleItem = {
  id: string;
  type: string;
  quantityNeeded: number;
  capacityNeeded: number | null;
  budget: number | null;
};

type Bundle = {
  id: string;
  title: string;
  city: string;
  eventDate: string;
  items: BundleItem[];
  requests: { id: string; status: string; resource: { id: string; title: string } }[];
};

type Match = { resourceId: string; providerId: string; providerName: string; title: string; score: number };
type MatchData = {
  itemMatches: Record<string, { itemId: string; type: string; matches: Match[] }>;
  fullFulfillment: { providerId: string; providerName: string; itemCount: number }[];
  partialFulfillment: { providerId: string; providerName: string; itemCount: number }[];
  totalItems: number;
};

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [matches, setMatches] = useState<MatchData | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSeq = useRef(0);
  const load = useCallback(() => {
    const seq = ++loadSeq.current;
    fetch(`/api/bundles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (seq === loadSeq.current) setBundle(d.bundle);
      });
    fetch(`/api/bundles/${id}/match`)
      .then((r) => r.json())
      .then((d) => {
        if (seq === loadSeq.current) setMatches(d);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendRequest(itemId: string, resourceId: string) {
    if (!bundle) return;
    setSending(resourceId);
    setMessage(null);
    const start = bundle.eventDate.slice(0, 10);
    const end = new Date(new Date(bundle.eventDate).getTime() + 86400000).toISOString().slice(0, 10);
    const item = bundle.items.find((i) => i.id === itemId);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        startDate: start,
        endDate: end,
        quantityNeeded: item?.quantityNeeded ?? 1,
        capacityNeeded: item?.capacityNeeded ?? undefined,
        budget: item?.budget ?? undefined,
        bundleId: bundle.id,
      }),
    });
    setSending(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error ?? "Failed to send request");
      return;
    }
    setMessage("Request sent!");
    load();
  }

  if (!bundle) return <p className="text-sm text-gray-500">Loading...</p>;

  const requestedResourceIds = new Set(bundle.requests.map((r) => r.resource.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{bundle.title}</h1>
        <p className="text-sm text-gray-600">
          {bundle.city} · Event on {formatDate(bundle.eventDate)}
        </p>
      </div>

      {message && <p className="text-sm text-teal-600 font-medium">{message}</p>}

      {matches && (matches.fullFulfillment.length > 0 || matches.partialFulfillment.length > 0) && (
        <Card className="p-4">
          <h2 className="font-semibold text-sm text-gray-900 mb-2">Providers who can fulfill this bundle</h2>
          {matches.fullFulfillment.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-emerald-700 mb-1">Full bundle ({matches.totalItems} of {matches.totalItems} items)</div>
              <ul className="space-y-1">
                {matches.fullFulfillment.map((p) => (
                  <li key={p.providerId} className="text-sm">{p.providerName}</li>
                ))}
              </ul>
            </div>
          )}
          {matches.partialFulfillment.length > 0 && (
            <div>
              <div className="text-xs font-medium text-amber-700 mb-1">Partial coverage</div>
              <ul className="space-y-1">
                {matches.partialFulfillment.map((p) => (
                  <li key={p.providerId} className="text-sm">
                    {p.providerName} — {p.itemCount} of {matches.totalItems} item(s)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <section className="space-y-4">
        {bundle.items.map((item) => {
          const itemMatch = matches?.itemMatches[item.id];
          return (
            <Card key={item.id} className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                {RESOURCE_TYPE_LABELS[item.type]} · Qty {item.quantityNeeded}
                {item.capacityNeeded ? ` · Capacity ${item.capacityNeeded}` : ""}
              </h3>
              {!itemMatch || itemMatch.matches.length === 0 ? (
                <p className="text-sm text-gray-500">No matching providers found.</p>
              ) : (
                <ul className="space-y-2">
                  {itemMatch.matches.map((m) => {
                    const alreadyRequested = requestedResourceIds.has(m.resourceId);
                    return (
                      <li key={m.resourceId} className="flex items-center justify-between text-sm">
                        <div>
                          <Link href={`/resources/${m.resourceId}`} className="text-gray-900 hover:text-teal-600 hover:underline font-medium">
                            {m.title}
                          </Link>
                          <span className="text-gray-500"> by {m.providerName}</span>
                        </div>
                        {alreadyRequested ? (
                          <span className="text-xs text-gray-500">Requested</span>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={sending === m.resourceId}
                            onClick={() => sendRequest(item.id, m.resourceId)}
                          >
                            {sending === m.resourceId ? "Sending..." : "Request"}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}
      </section>

      {bundle.requests.length > 0 && (
        <section>
          <h2 className="font-semibold text-sm text-gray-900 mb-2">Requests sent for this bundle</h2>
          <ul className="space-y-1">
            {bundle.requests.map((r) => (
              <li key={r.id} className="text-sm">
                <Link href={`/requests/${r.id}`} className="text-gray-900 hover:text-teal-600 hover:underline">
                  {r.resource.title}
                </Link>{" "}
                — {r.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
