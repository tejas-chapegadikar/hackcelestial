"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@prisma/client";

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
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-gray-200 rounded-2xl p-4 max-w-sm">
      <h3 className="font-semibold text-sm">Edit profile</h3>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Business name</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
        <input
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-gray-900 text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {saved && <span className="text-xs text-gray-900 ml-2">Saved</span>}
    </form>
  );
}
