"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BUSINESS_TYPE_LABELS } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessType: "HOTEL",
    city: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Sign up failed");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-1">Create a business account</h1>
      <p className="text-sm text-gray-600 mb-6">
        One account, both sides of the marketplace — list resources and request them.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business type</label>
          <select
            value={form.businessType}
            onChange={(e) => update("businessType", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded-full py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-gray-900 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
