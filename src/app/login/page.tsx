"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-8 bg-glow">
      <div className="flex justify-center mb-6">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-sm shadow-teal-600/30">
          <Sparkles className="w-5 h-5" strokeWidth={2.25} />
        </span>
      </div>
      <Card className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Demo: provider1@demo.com / seeker1@demo.com, password{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">password123</code>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </Card>
      <p className="text-sm text-gray-500 mt-4 text-center">
        No account?{" "}
        <Link href="/signup" className="text-teal-600 font-medium hover:text-teal-700">
          Sign up
        </Link>
      </p>
    </div>
  );
}
