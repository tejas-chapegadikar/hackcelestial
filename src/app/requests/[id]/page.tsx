"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn, formatCurrency, formatDate, formatDateTime, RESOURCE_TYPE_LABELS } from "@/lib/utils";
import { RequestStatusBadge, UrgentBadge, StarRating } from "@/components/Badges";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";

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
  basePrice: number | null;
  urgentSurchargePct: number | null;
  totalPrice: number | null;
  depositAmount: number | null;
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

function NegotiationBubble({ mine, msg }: { mine: boolean; msg: NegotiationMsg }) {
  if (msg.type === "ACCEPT" || msg.type === "REJECT") {
    return (
      <div className="text-center text-xs text-gray-400 py-1">
        {msg.sender.name} {msg.type === "ACCEPT" ? "accepted the request" : "declined the request"}
        {msg.message ? ` — ${msg.message}` : ""}
      </div>
    );
  }
  const isOffer = msg.type === "QUOTE" || msg.type === "COUNTER";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          mine ? "bg-teal-600 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"
        )}
      >
        {!mine && <div className="text-xs font-medium opacity-70 mb-0.5">{msg.sender.name}</div>}
        {isOffer && (
          <div className="font-semibold">
            {msg.type === "QUOTE" ? "Offer: " : "Counter-offer: "}
            {formatCurrency(msg.price!)}
          </div>
        )}
        {msg.message && <div>{msg.message}</div>}
        <div className={cn("text-[10px] mt-1", mine ? "text-teal-100" : "text-gray-400")}>
          {formatDateTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ request: RequestDetail; viewerId: string } | null>(null);
  const [composerPrice, setComposerPrice] = useState("");
  const [composerMessage, setComposerMessage] = useState("");
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
  const canMessage = request.status === "PENDING" || request.status === "COUNTERED";
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

  async function sendNegotiation(type: "MESSAGE" | "COUNTER", price?: number, message?: string) {
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
    setComposerPrice("");
    setComposerMessage("");
    load();
  }

  function sendComposer() {
    const price = composerPrice.trim() ? Number(composerPrice) : undefined;
    const message = composerMessage.trim() || undefined;
    if (price == null && !message) return;
    sendNegotiation(price != null ? "COUNTER" : "MESSAGE", price, message);
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
          <h1 className="text-2xl font-semibold text-gray-900">{request.resource.title}</h1>
          {request.urgent && <UrgentBadge />}
          <RequestStatusBadge status={request.status} />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {RESOURCE_TYPE_LABELS[request.resource.type]} · {formatDate(request.startDate)} –{" "}
          {formatDate(request.endDate)} · Qty {request.quantityNeeded}
          {request.capacityNeeded ? ` · Capacity ${request.capacityNeeded}` : ""}
        </p>
        <p className="text-sm text-gray-600">
          {isSeeker ? (
            <>Provider: {request.resource.provider.name}</>
          ) : (
            <>Seeker: {request.seeker.name}</>
          )}
        </p>
      </div>

      {request.totalPrice != null && (
        <Card className="p-4 space-y-1.5 text-sm">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Opening ask</h3>
          <div className="flex justify-between text-gray-600">
            <span>Base price ({formatCurrency(request.resource.pricePerUnit)}/{request.resource.unit.toLowerCase()})</span>
            <span>{formatCurrency(request.basePrice ?? 0)}</span>
          </div>
          {!!request.urgentSurchargePct && (
            <div className="flex justify-between text-red-600">
              <span>Urgent surcharge (+{Math.round(request.urgentSurchargePct * 100)}%)</span>
              <span>+{formatCurrency((request.totalPrice ?? 0) - (request.basePrice ?? 0))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t border-gray-100">
            <span>Total</span>
            <span>{formatCurrency(request.totalPrice)}</span>
          </div>
          {request.budget != null && (
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Seeker&apos;s budget</span>
              <span>{formatCurrency(request.budget)}</span>
            </div>
          )}
          {request.depositAmount != null && (
            <div className="flex items-start gap-1.5 text-xs text-teal-700 pt-1.5 border-t border-gray-100">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
              <span>Refundable deposit of {formatCurrency(request.depositAmount)}, returned in good condition.</span>
            </div>
          )}
        </Card>
      )}

      {alternatives && alternatives.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <h3 className="font-semibold text-slate-900 mb-2">Suggested alternatives</h3>
          <ul className="space-y-1">
            {alternatives.map((a) => (
              <li key={a.resource.id} className="text-sm">
                <Link href={`/resources/${a.resource.id}`} className="text-slate-900 hover:underline">
                  {a.resource.title}
                </Link>{" "}
                — {formatCurrency(a.resource.pricePerUnit)} in {a.resource.city}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Messages</h3>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {request.negotiation.map((m) => (
            <NegotiationBubble key={m.id} mine={m.sender.id === viewerId} msg={m} />
          ))}
          {request.negotiation.length === 0 && (
            <p className="text-sm text-gray-500">No messages yet — say hello or make an offer.</p>
          )}
        </div>

        {canMessage && (
          <div className="border-t border-gray-100 pt-3 space-y-3">
            {canRespond && (
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => doAction("ACCEPT")}
                  className="bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  disabled={busy}
                  onClick={() => doAction("REJECT")}
                  className="bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-28">
                <Label size="sm">Offer (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="₹"
                  value={composerPrice}
                  onChange={(e) => setComposerPrice(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <Label size="sm">Message</Label>
                <Input
                  value={composerMessage}
                  onChange={(e) => setComposerMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendComposer();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                disabled={busy || (!composerPrice.trim() && !composerMessage.trim())}
                onClick={sendComposer}
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {request.status === "ACCEPTED" && (
          <div className="border-t border-gray-100 pt-3 flex gap-2">
            <Button type="button" disabled={busy} onClick={() => doAction("COMPLETE")}>
              Mark completed
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => doAction("CANCEL")}>
              Cancel
            </Button>
          </div>
        )}

        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      </Card>

      {request.status === "COMPLETED" && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Reviews</h3>
          {request.reviews.map((r) => (
            <div key={r.id} className="text-sm">
              <StarRating value={r.rating} />
              {r.comment && <p className="text-gray-700">{r.comment}</p>}
            </div>
          ))}
          {!myReview && !reviewSubmitted && (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <Label size="sm" className="mb-0">Rating</Label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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
                  {request.depositAmount != null ? "Returned in good condition" : "Good condition"}
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
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Comment (optional)"
                rows={2}
              />
              <Button type="button" disabled={busy} onClick={submitReview}>
                Submit review
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
