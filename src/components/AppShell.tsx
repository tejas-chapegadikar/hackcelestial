"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Folder, Gift, Home, Inbox, LogOut, Search, Sparkles } from "lucide-react";
import { cn, avatarColor, initials } from "@/lib/utils";
import { buttonClasses } from "@/components/ui";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/resources", label: "Browse", icon: Search },
  { href: "/my-resources", label: "My Resources", icon: Folder },
  { href: "/requests", label: "Requests", icon: Inbox },
  { href: "/bundles", label: "Bundles", icon: Gift },
];

function Logo() {
  return (
    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/30">
      <Sparkles className="w-4 h-4" strokeWidth={2.25} />
    </span>
  );
}

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
        <header className="border-b border-gray-100 sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-semibold text-gray-900">
              <Logo />
              Hospitality Exchange
            </Link>
            <div className="flex items-center gap-2">
              {status === "loading" ? null : (
                <>
                  <Link href="/login" className={buttonClasses("ghost", "sm")}>
                    Log in
                  </Link>
                  <Link href="/signup" className={buttonClasses("primary", "sm")}>
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
    <div className="min-h-screen flex bg-[#fafafa]">
      <aside className="w-60 shrink-0 border-r border-gray-100 bg-white flex flex-col fixed inset-y-0 left-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 h-16 shrink-0">
          <Logo />
          <span className="font-semibold text-gray-900 truncate">Hospitality Exchange</span>
        </Link>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  active ? "bg-teal-50 text-teal-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/notifications"
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              pathname === "/notifications" ? "bg-teal-50 text-teal-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <span className="flex items-center gap-2.5">
              <Bell className="w-4 h-4" strokeWidth={2} />
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] leading-none rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="border-t border-gray-100 p-3 space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors"
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
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 px-8 py-8 max-w-5xl">{children}</main>
    </div>
  );
}
