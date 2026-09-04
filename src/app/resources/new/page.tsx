"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RESOURCE_TYPE_LABELS, formatCurrency } from "@/lib/utils";

type Benchmark = { min: number; max: number; avg: number; sampleSize: number; scope: string };

export default function NewResourcePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "BANQUET_SPACE",
    title: "",
    description: "",
    quantity: "1",
    capacity: "",
    unit: "DAY",
    pricePerUnit: "",
    minRentalPeriod: "1",
    amenities: "",
    city: "",
  });
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (!form.type || !form.city || form.city.length < 2) {
      setBenchmark(null);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/resources/price-benchmark?type=${form.type}&city=${encodeURIComponent(form.city)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((d) => setBenchmark(d.benchmark))
        .catch(() => {});
    }, 400);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [form.type, form.city]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        quantity: Number(form.quantity),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit),
        minRentalPeriod: Number(form.minRentalPeriod),
        amenities: form.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        city: form.city,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? "Failed to create listing");
      return;
    }
    const created = await res.json();
    router.push(`/resources/${created.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">List a resource</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity available</label>
            <input
              type="number"
              min={1}
              required
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (optional)
            </label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => update("capacity", e.target.value)}
              placeholder="e.g. seats, cars"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rental unit</label>
            <select
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="DAY">Per day</option>
              <option value="HOUR">Per hour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum rental period
            </label>
            <input
              type="number"
              min={1}
              required
              value={form.minRentalPeriod}
              onChange={(e) => update("minRentalPeriod", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price per {form.unit.toLowerCase()} (₹)
          </label>
          <input
            type="number"
            min={0}
            required
            value={form.pricePerUnit}
            onChange={(e) => update("pricePerUnit", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {benchmark && (
            <p className="text-xs text-gray-900 mt-1.5">
              💡 Similar resources {benchmark.scope === "city" ? "in your area" : "on the platform"} are
              priced between {formatCurrency(benchmark.min)} – {formatCurrency(benchmark.max)} (avg{" "}
              {formatCurrency(benchmark.avg)}, {benchmark.sampleSize} listing(s)).
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amenities (comma separated)
          </label>
          <input
            value={form.amenities}
            onChange={(e) => update("amenities", e.target.value)}
            placeholder="AC, Stage, Sound System"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
