"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime, RESOURCE_TYPE_LABELS } from "@/lib/utils";
import { RequestStatusBadge, UrgentBadge, StarRating } from "@/components/Badges";

type NegotiationMsg = {
  id: string;
  type: string;
  price: number | null;
  message: string | null;
  createdAt: string;
  sender: { id: string; name: string };
};

type RequestDetail = {
  id: string;
  status: string;
  urgent: boolean;
  startDate: string;
  endDate: string;
  quantityNeeded: number;
  capacityNeeded: number | null;
  budget: number | null;
  seekerId: string;
  resource: {
    id: string;
    title: string;
    type: string;
    pricePerUnit: number;
    unit: string;
    provider: { id: string; name: string };
  };
  seeker: { id: string; name: string };
  negotiation: NegotiationMsg[];
  reviews: { id: string; fromId: string; rating: number; comment: string | null }[];
};

type Alternative = { resource: { id: string; title: string; pricePerUnit: number; city: string }; score: number };

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ request: RequestDetail; viewerId: string } | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [plainMessage, setPlainMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, onTime: true, conditionOk: true, punctual: true, comment: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const loadSeq = useRef(0);
  const load = useCallback(() => {
    const seq = ++loadSeq.current;
    fetch(`/api/requests/${id}`)
      .then((r) => r.json())
      .then((d) => {
        // Ignore this response if a newer load() has been kicked off since
        // (e.g. React dev double-effects racing a post-action refetch).
        if (seq === loadSeq.current) setData(d);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <p className="text-sm text-gray-500">Loading...</p>;
  const { request, viewerId } = data;
  const isSeeker = request.seekerId === viewerId;
  const lastSender = request.negotiation[request.negotiation.length - 1]?.sender.id ?? request.seekerId;
  const canRespond =
    (request.status === "PENDING" || request.status === "COUNTERED") && lastSender !== viewerId;
  const myReview = request.reviews.find((r) => r.fromId === viewerId);

  async function doAction(action: "ACCEPT" | "REJECT" | "CANCEL" | "COMPLETE") {
    setBusy(true);
    setActionError(null);
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) {
      setActionError(body.error ?? "Action failed");
      return;
    }
    if (action === "REJECT" && body.alternatives?.length) {
      setAlternatives(body.alternatives);
    }
    load();
  }

  async function sendNegotiation(type: "MESSAGE" | "QUOTE" | "COUNTER", price?: number, message?: string) {
    setBusy(true);
    setActionError(null);
    const res = await fetch(`/api/requests/${id}/negotiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, price, message }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? "Failed to send");
      return;
    }
    setCounterPrice("");
    setCounterMessage("");
    setPlainMessage("");
    load();
  }

  async function submitReview() {
    setBusy(true);
    setActionError(null);
    const res = await fetch(`/api/requests/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewForm),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? "Failed to submit review");
      return;
    }
    setReviewSubmitted(true);
    load();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">{request.resource.title}</h1>
          {request.urgent && <UrgentBadge />}
          <RequestStatusBadge status={request.status} />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {RESOURCE_TYPE_LABELS[request.resource.type]} · {formatDate(request.startDate)} –{" "}
          {formatDate(request.endDate)} · Qty {request.quantityNeeded}
          {request.capacityNeeded ? ` · Capacity ${request.capacityNeeded}` : ""}
          {request.budget ? ` · Budget ${formatCurrency(request.budget)}` : ""}
        </p>
        <p className="text-sm text-gray-600">
          {isSeeker ? (
            <>Provider: {request.resource.provider.name}</>
          ) : (
            <>Seeker: {request.seeker.name}</>
          )}
        </p>
      </div>

      {alternatives && alternatives.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Suggested alternatives</h3>
          <ul className="space-y-1">
            {alternatives.map((a) => (
              <li key={a.resource.id} className="text-sm">
                <Link href={`/resources/${a.resource.id}`} className="text-teal-700 hover:underline">
                  {a.resource.title}
                </Link>{" "}
                — {formatCurrency(a.resource.pricePerUnit)} in {a.resource.city}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm">Negotiation timeline</h3>
        <ul className="space-y-3">
          {request.negotiation.map((m) => (
            <li key={m.id} className="text-sm border-l-2 border-teal-200 pl-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{m.sender.name}</span>
                <span className="text-xs text-gray-400">{formatDateTime(m.createdAt)}</span>
                <span className="text-xs uppercase tracking-wide text-gray-400">{m.type}</span>
              </div>
              {m.price != null && <div className="text-teal-700 font-medium">{formatCurrency(m.price)}</div>}
              {m.message && <div className="text-gray-700">{m.message}</div>}
            </li>
          ))}
          {request.negotiation.length === 0 && (
            <li className="text-sm text-gray-500">No messages yet.</li>
          )}
        </ul>

        {(request.status === "PENDING" || request.status === "COUNTERED") && (
          <div className="border-t border-gray-100 pt-3 space-y-3">
            {canRespond ? (
              <>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => doAction("ACCEPT")}
                    className="bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => doAction("REJECT")}
                    className="bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Counter price</label>
                    <input
                      type="number"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-32"
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-xs text-gray-600 mb-1">Note</label>
                    <input
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full"
                    />
                  </div>
                  <button
                    disabled={busy || !counterPrice}
                    onClick={() => sendNegotiation("COUNTER", Number(counterPrice), counterMessage || undefined)}
                    className="border border-gray-300 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Send counter-offer
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">Waiting on the other party to respond.</p>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Message</label>
                <input
                  value={plainMessage}
                  onChange={(e) => setPlainMessage(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm w-full"
                />
              </div>
              <button
                disabled={busy || !plainMessage}
                onClick={() => sendNegotiation("MESSAGE", undefined, plainMessage)}
                className="border border-gray-300 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {request.status === "ACCEPTED" && (
          <div className="border-t border-gray-100 pt-3 flex gap-2">
            <button
              disabled={busy}
              onClick={() => doAction("COMPLETE")}
              className="bg-teal-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              Mark completed
            </button>
            <button
              disabled={busy}
              onClick={() => doAction("CANCEL")}
              className="border border-gray-300 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}

        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      </div>

      {request.status === "COMPLETED" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">Reviews</h3>
          {request.reviews.map((r) => (
            <div key={r.id} className="text-sm">
              <StarRating value={r.rating} />
              {r.comment && <p className="text-gray-700">{r.comment}</p>}
            </div>
          ))}
          {!myReview && !reviewSubmitted && (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <label className="block text-xs text-gray-600">Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n !== 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 text-xs text-gray-600">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={reviewForm.onTime}
                    onChange={(e) => setReviewForm((f) => ({ ...f, onTime: e.target.checked }))}
                  />
                  On time
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={reviewForm.conditionOk}
                    onChange={(e) => setReviewForm((f) => ({ ...f, conditionOk: e.target.checked }))}
                  />
                  Good condition
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={reviewForm.punctual}
                    onChange={(e) => setReviewForm((f) => ({ ...f, punctual: e.target.checked }))}
                  />
                  Punctual
                </label>
              </div>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Comment (optional)"
                rows={2}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              />
              <button
                disabled={busy}
                onClick={submitReview}
                className="bg-teal-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                Submit review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
