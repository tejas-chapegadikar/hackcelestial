"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resources", label: "Browse" },
  { href: "/my-resources", label: "My Resources" },
  { href: "/requests", label: "Requests" },
  { href: "/bundles", label: "Bundles" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setUnreadCount(d.unreadCount ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status, pathname]);

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur sticky top-0 z-10">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold text-teal-700 shrink-0">
          Hospitality Exchange
        </Link>

        {status === "authenticated" && (
          <div className="hidden sm:flex items-center gap-1 flex-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {status === "authenticated" ? (
            <>
              <Link
                href="/notifications"
                className="relative px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 hidden sm:inline"
              >
                {session.user?.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </>
          ) : status === "loading" ? null : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
