"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { RESOURCE_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

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
    depositAmount: "",
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
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">List a resource</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onChange={(e) => update("type", e.target.value)}>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Title</Label>
          <Input required value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Quantity available</Label>
            <Input
              type="number"
              min={1}
              required
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
            />
          </div>
          <div>
            <Label>Capacity (optional)</Label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => update("capacity", e.target.value)}
              placeholder="e.g. seats, cars"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Rental unit</Label>
            <Select value={form.unit} onChange={(e) => update("unit", e.target.value)}>
              <option value="DAY">Per day</option>
              <option value="HOUR">Per hour</option>
            </Select>
          </div>
          <div>
            <Label>Minimum rental period</Label>
            <Input
              type="number"
              min={1}
              required
              value={form.minRentalPeriod}
              onChange={(e) => update("minRentalPeriod", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>City</Label>
          <Input required value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div>
          <Label>Price per {form.unit.toLowerCase()} (₹)</Label>
          <Input
            type="number"
            min={0}
            required
            value={form.pricePerUnit}
            onChange={(e) => update("pricePerUnit", e.target.value)}
          />
          {benchmark && (
            <p className="flex items-start gap-1.5 text-xs text-gray-600 mt-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" strokeWidth={2} />
              Similar resources {benchmark.scope === "city" ? "in your area" : "on the platform"} are
              priced between {formatCurrency(benchmark.min)} – {formatCurrency(benchmark.max)} (avg{" "}
              {formatCurrency(benchmark.avg)}, {benchmark.sampleSize} listing(s)).
            </p>
          )}
        </div>
        <div>
          <Label>Refundable deposit (optional)</Label>
          <Input
            type="number"
            min={0}
            value={form.depositAmount}
            onChange={(e) => update("depositAmount", e.target.value)}
            placeholder="e.g. 5000"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Worth setting for returnable items like furniture, AV gear or vehicles — held by you and
            returned to the seeker once the item comes back in good condition.
          </p>
        </div>
        <div>
          <Label>Amenities (comma separated)</Label>
          <Input
            value={form.amenities}
            onChange={(e) => update("amenities", e.target.value)}
            placeholder="AC, Stage, Sound System"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Publishing..." : "Publish listing"}
        </Button>
      </form>
    </div>
  );
}
