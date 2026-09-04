"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESOURCE_TYPE_LABELS } from "@/lib/utils";

type Item = { type: string; quantityNeeded: string; capacityNeeded: string; budget: string; amenities: string };

const emptyItem: Item = { type: "BANQUET_SPACE", quantityNeeded: "1", capacityNeeded: "", budget: "", amenities: "" };

export default function NewBundlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        eventDate,
        city,
        items: items.map((it) => ({
          type: it.type,
          quantityNeeded: Number(it.quantityNeeded) || 1,
          capacityNeeded: it.capacityNeeded ? Number(it.capacityNeeded) : undefined,
          budget: it.budget ? Number(it.budget) : undefined,
          amenities: it.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Failed to create bundle");
      return;
    }
    const created = await res.json();
    router.push(`/bundles/${created.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Build an event bundle</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Event title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sharma Wedding, Dec 12"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event date</label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Resources needed</h2>
            <button
              type="button"
              onClick={() => setItems((its) => [...its, { ...emptyItem }])}
              className="text-sm text-gray-900 font-medium"
            >
              + Add another resource
            </button>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-3 grid sm:grid-cols-4 gap-2">
              <select
                value={it.type}
                onChange={(e) => updateItem(idx, { type: e.target.value })}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white sm:col-span-1"
              >
                {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                placeholder="Qty"
                value={it.quantityNeeded}
                onChange={(e) => updateItem(idx, { quantityNeeded: e.target.value })}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={1}
                placeholder="Capacity"
                value={it.capacityNeeded}
                onChange={(e) => updateItem(idx, { capacityNeeded: e.target.value })}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="Budget"
                value={it.budget}
                onChange={(e) => updateItem(idx, { budget: e.target.value })}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((its) => its.filter((_, i) => i !== idx))}
                  className="sm:col-span-4 text-xs text-red-600 text-left"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create bundle & find matches"}
        </button>
      </form>
    </div>
  );
}
