"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { RESOURCE_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import { CompatibilityBadge, MinRentalBadge, StarRating } from "@/components/Badges";

type SearchResult = {
  resource: {
    id: string;
    title: string;
    type: string;
    city: string;
    pricePerUnit: number;
    unit: string;
    capacity: number | null;
    quantity: number;
    minRentalPeriod: number;
    amenities: string[];
  };
  provider: { id: string; name: string; city: string };
  score: number;
  distanceKm: number | null;
  compatibility: { compatible: boolean; reasons: string[] };
  minRental: { ok: boolean; reason?: string };
  trust?: { avgRating: number; count: number };
};

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ResourcesPage() {
  const [filters, setFilters] = useState({
    type: "",
    city: "",
    startDate: todayPlus(1),
    endDate: todayPlus(2),
    quantityNeeded: "",
    capacityNeeded: "",
    budget: "",
    enforceMinRental: true,
  });
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const searchSeq = useRef(0);
  const search = useCallback(async () => {
    const seq = ++searchSeq.current;
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.city) params.set("city", filters.city);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.quantityNeeded) params.set("quantityNeeded", filters.quantityNeeded);
    if (filters.capacityNeeded) params.set("capacityNeeded", filters.capacityNeeded);
    if (filters.budget) params.set("budget", filters.budget);
    params.set("enforceMinRental", String(filters.enforceMinRental));

    const res = await fetch(`/api/resources?${params.toString()}`);
    const data = await res.json();
    if (seq !== searchSeq.current) return;
    setResults(data.results ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Browse resources</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="bg-white border border-gray-200 rounded-lg p-4 grid sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
          >
            <option value="">Any</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <input
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            placeholder="e.g. Mumbai"
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Qty needed</label>
          <input
            type="number"
            min={1}
            value={filters.quantityNeeded}
            onChange={(e) => setFilters((f) => ({ ...f, quantityNeeded: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Capacity needed</label>
          <input
            type="number"
            min={1}
            value={filters.capacityNeeded}
            onChange={(e) => setFilters((f) => ({ ...f, capacityNeeded: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Budget (per unit)</label>
          <input
            type="number"
            min={0}
            value={filters.budget}
            onChange={(e) => setFilters((f) => ({ ...f, budget: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={filters.enforceMinRental}
              onChange={(e) => setFilters((f) => ({ ...f, enforceMinRental: e.target.checked }))}
            />
            Enforce min. rental
          </label>
        </div>
        <div className="sm:col-span-3 lg:col-span-4">
          <button
            type="submit"
            className="bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-teal-700"
          >
            Search
          </button>
        </div>
      </form>

      {loading && <p className="text-sm text-gray-500">Searching...</p>}

      {!loading && results && results.length === 0 && (
        <p className="text-sm text-gray-500">No resources match your criteria.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results?.map((r) => (
          <Link
            key={r.resource.id}
            href={`/resources/${r.resource.id}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors flex flex-col gap-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.resource.title}</div>
                <div className="text-xs text-gray-500">
                  {RESOURCE_TYPE_LABELS[r.resource.type]} · {r.resource.city}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-teal-700">
                  {formatCurrency(r.resource.pricePerUnit)}
                </div>
                <div className="text-xs text-gray-500">/{r.resource.unit.toLowerCase()}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">by {r.provider.name}</div>
            {r.trust && r.trust.count > 0 && <StarRating value={r.trust.avgRating} />}
            <div className="flex flex-wrap gap-1.5 mt-1">
              <CompatibilityBadge compatible={r.compatibility.compatible} reasons={r.compatibility.reasons} />
              <MinRentalBadge ok={r.minRental.ok} reason={r.minRental.reason} />
              {r.distanceKm != null && (
                <span className="text-xs text-gray-500">{r.distanceKm.toFixed(0)} km away</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
