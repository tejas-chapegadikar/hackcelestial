"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resource, UnavailableRange } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type Props = {
  resource: Resource & { unavailableRanges: UnavailableRange[] };
};

export default function EditResourceForm({ resource }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: resource.title,
    description: resource.description ?? "",
    quantity: String(resource.quantity),
    capacity: resource.capacity != null ? String(resource.capacity) : "",
    pricePerUnit: String(resource.pricePerUnit),
    minRentalPeriod: String(resource.minRentalPeriod),
    amenities: resource.amenities.join(", "),
    city: resource.city,
    status: resource.status,
  });
  const [ranges, setRanges] = useState(resource.unavailableRanges);
  const [blockForm, setBlockForm] = useState({ startDate: "", endDate: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/resources/${resource.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        quantity: Number(form.quantity),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        pricePerUnit: Number(form.pricePerUnit),
        minRentalPeriod: Number(form.minRentalPeriod),
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        city: form.city,
        status: form.status,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to save changes");
      return;
    }
    router.push(`/resources/${resource.id}`);
    router.refresh();
  }

  async function handleBlockRange(e: React.FormEvent) {
    e.preventDefault();
    if (!blockForm.startDate || !blockForm.endDate) return;
    const res = await fetch(`/api/resources/${resource.id}/unavailable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockForm),
    });
    if (res.ok) {
      const created = await res.json();
      setRanges((r) => [...r, created]);
      setBlockForm({ startDate: "", endDate: "", reason: "" });
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const res = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
    if (res.ok) router.push("/my-resources");
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-6">Edit listing</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per {resource.unit.toLowerCase()} (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.pricePerUnit}
                onChange={(e) => update("pricePerUnit", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. rental period</label>
              <input
                type="number"
                min={1}
                value={form.minRentalPeriod}
                onChange={(e) => update("minRentalPeriod", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
            <input
              value={form.amenities}
              onChange={(e) => update("amenities", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as "ACTIVE" | "INACTIVE")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="border border-red-300 text-red-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Block dates</h2>
        <form onSubmit={handleBlockRange} className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={blockForm.startDate}
              onChange={(e) => setBlockForm((f) => ({ ...f, startDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={blockForm.endDate}
              onChange={(e) => setBlockForm((f) => ({ ...f, endDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Reason</label>
            <input
              value={blockForm.reason}
              onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Maintenance"
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
          >
            Block
          </button>
        </form>
        <ul className="space-y-1">
          {ranges.map((r) => (
            <li key={r.id} className="text-sm text-gray-700">
              {formatDate(r.startDate)} – {formatDate(r.endDate)}
              {r.reason && <span className="text-gray-500"> ({r.reason})</span>}
            </li>
          ))}
          {ranges.length === 0 && <li className="text-sm text-gray-500">No blocked dates.</li>}
        </ul>
      </div>
    </div>
  );
}
