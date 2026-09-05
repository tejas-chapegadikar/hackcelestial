"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { computeQuote } from "@/lib/pricing";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";

type Props = {
  resourceId: string;
  resource: { pricePerUnit: number; unit: "HOUR" | "DAY"; depositAmount: number | null };
};

export default function RequestForm({ resourceId, resource }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    quantityNeeded: "1",
    capacityNeeded: "",
    budget: "",
    urgent: false,
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const quote = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) return null;
    return computeQuote(resource, {
      startDate: start,
      endDate: end,
      quantityNeeded: Number(form.quantityNeeded) || 1,
      urgent: form.urgent,
    });
  }, [form.startDate, form.endDate, form.quantityNeeded, form.urgent, resource]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReasons(null);
    setLoading(true);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        startDate: form.startDate,
        endDate: form.endDate,
        quantityNeeded: Number(form.quantityNeeded),
        capacityNeeded: form.capacityNeeded ? Number(form.capacityNeeded) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        urgent: form.urgent,
        message: form.message || undefined,
      }),
    });

    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to send request");
      if (data.reasons) setReasons(data.reasons);
      return;
    }
    router.push(`/requests/${data.id}`);
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="font-semibold text-gray-900">Request this resource</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label size="sm">From</Label>
            <Input type="date" required value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
          </div>
          <div>
            <Label size="sm">To</Label>
            <Input type="date" required value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
          </div>
          <div>
            <Label size="sm">Quantity needed</Label>
            <Input
              type="number"
              min={1}
              value={form.quantityNeeded}
              onChange={(e) => update("quantityNeeded", e.target.value)}
            />
          </div>
          <div>
            <Label size="sm">Capacity needed</Label>
            <Input
              type="number"
              min={1}
              value={form.capacityNeeded}
              onChange={(e) => update("capacityNeeded", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label size="sm">Budget per unit (optional)</Label>
          <Input type="number" min={0} value={form.budget} onChange={(e) => update("budget", e.target.value)} />
        </div>
        <div>
          <Label size="sm">Message (optional)</Label>
          <Textarea value={form.message} onChange={(e) => update("message", e.target.value)} rows={2} />
        </div>
        <label className="flex items-center gap-2 text-sm text-red-600">
          <input
            type="checkbox"
            checked={form.urgent}
            onChange={(e) => update("urgent", e.target.checked)}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <Zap className="w-3.5 h-3.5 fill-red-600" strokeWidth={0} />
          Needed urgently (same-day/tonight) — jumps to the top of the provider&apos;s inbox
        </label>

        {quote && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {formatCurrency(resource.pricePerUnit)} × {quote.units} {resource.unit.toLowerCase()}(s) ×{" "}
                {form.quantityNeeded || 1}
              </span>
              <span>{formatCurrency(quote.basePrice)}</span>
            </div>
            {form.urgent && (
              <div className="flex justify-between text-red-600">
                <span>Urgent surcharge (+{Math.round(quote.urgentSurchargePct * 100)}%)</span>
                <span>+{formatCurrency(quote.surchargeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t border-gray-200">
              <span>Estimated total</span>
              <span>{formatCurrency(quote.totalPrice)}</span>
            </div>
            {!form.urgent && (
              <p className="text-xs text-gray-500">Booking in advance — normal rate, no surcharge.</p>
            )}
            {resource.depositAmount != null && (
              <div className="flex items-start gap-1.5 text-xs text-teal-700 pt-1.5 border-t border-gray-200">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                  Plus a refundable deposit of {formatCurrency(resource.depositAmount)}, returned once the item is
                  back in good condition.
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            {error}
            {reasons && (
              <ul className="list-disc list-inside mt-1">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send request"}
        </Button>
      </form>
    </Card>
  );
}
