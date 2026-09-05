"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { RESOURCE_TYPE_LABELS } from "@/lib/utils";
import { Button, Card, Input, Label, Select } from "@/components/ui";

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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Build an event bundle</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label>Event title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sharma Wedding, Dec 12" />
          </div>
          <div>
            <Label>Event date</Label>
            <Input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>City</Label>
          <Input required value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900">Resources needed</h2>
            <button
              type="button"
              onClick={() => setItems((its) => [...its, { ...emptyItem }])}
              className="text-sm text-teal-600 font-medium hover:text-teal-700"
            >
              + Add another resource
            </button>
          </div>
          {items.map((it, idx) => (
            <Card key={idx} className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Select value={it.type} onChange={(e) => updateItem(idx, { type: e.target.value })} className="sm:col-span-1">
                {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={1}
                placeholder="Qty"
                value={it.quantityNeeded}
                onChange={(e) => updateItem(idx, { quantityNeeded: e.target.value })}
              />
              <Input
                type="number"
                min={1}
                placeholder="Capacity"
                value={it.capacityNeeded}
                onChange={(e) => updateItem(idx, { capacityNeeded: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                placeholder="Budget"
                value={it.budget}
                onChange={(e) => updateItem(idx, { budget: e.target.value })}
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((its) => its.filter((_, i) => i !== idx))}
                  className="sm:col-span-4 flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                  Remove
                </button>
              )}
            </Card>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create bundle & find matches"}
        </Button>
      </form>
    </div>
  );
}
