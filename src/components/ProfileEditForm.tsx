"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@prisma/client";
import { Button, Card, Input, Label } from "@/components/ui";

export default function ProfileEditForm({ business }: { business: Business }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: business.name,
    city: business.city,
    phone: business.phone ?? "",
    address: business.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Edit profile</h3>
        <div>
          <Label size="sm">Business name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label size="sm">City</Label>
          <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        </div>
        <div>
          <Label size="sm">Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <Label size="sm">Address</Label>
          <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {saved && <span className="text-xs text-teal-600">Saved</span>}
        </div>
      </form>
    </Card>
  );
}
