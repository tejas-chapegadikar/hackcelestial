"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Resource, UnavailableRange } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

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
    depositAmount: resource.depositAmount != null ? String(resource.depositAmount) : "",
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
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
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
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit listing</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Price per item, per {resource.unit.toLowerCase()} (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.pricePerUnit}
                onChange={(e) => update("pricePerUnit", e.target.value)}
              />
            </div>
            <div>
              <Label>Min. rental period</Label>
              <Input
                type="number"
                min={1}
                value={form.minRentalPeriod}
                onChange={(e) => update("minRentalPeriod", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div>
            <Label>Refundable deposit</Label>
            <Input
              type="number"
              min={0}
              value={form.depositAmount}
              onChange={(e) => update("depositAmount", e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <Label>Amenities</Label>
            <Input value={form.amenities} onChange={(e) => update("amenities", e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => update("status", e.target.value as "ACTIVE" | "INACTIVE")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Block dates</h2>
        <form onSubmit={handleBlockRange} className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <Label size="sm">From</Label>
            <Input
              type="date"
              value={blockForm.startDate}
              onChange={(e) => setBlockForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <Label size="sm">To</Label>
            <Input
              type="date"
              value={blockForm.endDate}
              onChange={(e) => setBlockForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div>
            <Label size="sm">Reason</Label>
            <Input
              value={blockForm.reason}
              onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Maintenance"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Block
          </Button>
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
