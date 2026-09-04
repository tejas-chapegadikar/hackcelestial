"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { cn, avatarColor, initials } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/resources", label: "Browse", icon: "🔍" },
  { href: "/my-resources", label: "My Resources", icon: "🗂️" },
  { href: "/requests", label: "Requests", icon: "📨" },
  { href: "/bundles", label: "Bundles", icon: "🎁" },
];

export default function AppShell({ children }: { children: ReactNode }) {
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

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs">
                HX
              </span>
              Hospitality Exchange
            </Link>
            <div className="flex items-center gap-3">
              {status === "loading" ? null : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col fixed inset-y-0 left-0">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 h-16 shrink-0">
          <span className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs shrink-0">
            HX
          </span>
          <span className="font-semibold text-gray-900 truncate">Hospitality Exchange</span>
        </Link>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <span className="text-base leading-none">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/notifications"
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/notifications" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base leading-none">🔔</span>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] leading-none rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="border-t border-gray-200 p-3 space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span
              className={cn(
                "w-7 h-7 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0",
                avatarColor(session.user.id)
              )}
            >
              {initials(session.user?.name ?? "?")}
            </span>
            <span className="text-sm font-medium text-gray-800 truncate">{session.user?.name}</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 px-8 py-8 max-w-5xl">{children}</main>
    </div>
  );
}
