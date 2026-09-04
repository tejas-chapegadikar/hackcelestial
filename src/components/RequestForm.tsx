"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestForm({ resourceId }: { resourceId: string }) {
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
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold">Request this resource</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            required
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity needed</label>
          <input
            type="number"
            min={1}
            value={form.quantityNeeded}
            onChange={(e) => update("quantityNeeded", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Capacity needed</label>
          <input
            type="number"
            min={1}
            value={form.capacityNeeded}
            onChange={(e) => update("capacityNeeded", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Budget per unit (optional)</label>
        <input
          type="number"
          min={0}
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Message (optional)</label>
        <textarea
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-red-700">
        <input type="checkbox" checked={form.urgent} onChange={(e) => update("urgent", e.target.checked)} />
        Mark as urgent — jumps to the top of the provider&apos;s inbox
      </label>
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
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
