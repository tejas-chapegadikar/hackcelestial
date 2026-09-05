"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Folder, Gift, Home, Inbox, LogOut, Menu, Search, Sparkles, X } from "lucide-react";
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

function NavLinks({ pathname, unreadCount, onNavigate }: { pathname: string; unreadCount: number; onNavigate?: () => void }) {
  return (
    <>
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
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
        onClick={onNavigate}
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
    </>
  );
}

function ProfileBlock({ name, userId }: { name: string; userId: string }) {
  return (
    <div className="border-t border-gray-100 p-3 space-y-1 shrink-0">
      <Link href="/profile" className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
        <span
          className={cn(
            "w-7 h-7 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0",
            avatarColor(userId)
          )}
        >
          {initials(name)}
        </span>
        <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
        Sign out
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const authenticated = status === "authenticated";
  const name = session?.user?.name ?? "?";
  const userId = session?.user?.id ?? "";

  // A single, stable tree shape across the loading -> authenticated transition matters:
  // returning two different JSX trees here would make React unmount/remount `children`
  // (and re-run its mount-time data fetches) the instant the session resolves on every
  // hard page load, since useSession() always starts in "loading" with no SSR session.
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {authenticated && (
        <>
          <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900">
              <Logo />
              Hospitality Exchange
            </Link>
            <Link href="/notifications" className="relative p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <Bell className="w-5 h-5" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] leading-none rounded-full h-3.5 min-w-3.5 px-0.5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </header>

          {mobileNavOpen && (
            <div className="lg:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-gray-900/40" onClick={() => setMobileNavOpen(false)} />
              <aside className="absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white flex flex-col shadow-xl">
                <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
                  <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900">
                    <Logo />
                    Hospitality Exchange
                  </Link>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Close menu"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
                <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
                  <NavLinks pathname={pathname} unreadCount={unreadCount} onNavigate={() => setMobileNavOpen(false)} />
                </nav>
                <ProfileBlock name={name} userId={userId} />
              </aside>
            </div>
          )}

          <aside className="hidden lg:flex w-60 shrink-0 border-r border-gray-100 bg-white flex-col fixed inset-y-0 left-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 px-5 h-16 shrink-0">
              <Logo />
              <span className="font-semibold text-gray-900 truncate">Hospitality Exchange</span>
            </Link>

            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
              <NavLinks pathname={pathname} unreadCount={unreadCount} />
            </nav>

            <ProfileBlock name={name} userId={userId} />
          </aside>
        </>
      )}

      {!authenticated && (
        <header className="border-b border-gray-100 sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-semibold text-gray-900">
              <Logo />
              <span className="hidden sm:inline">Hospitality Exchange</span>
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
      )}

      {/*
        Two layers on purpose: this outer <main> only ever handles the sidebar
        offset (lg:ml-60). Combining a left margin with w-full/mx-auto on the
        same element makes its box wider than the viewport (100% of the
        container *plus* the margin), causing horizontal overflow — so the
        max-width/centering/padding lives on the inner div instead, sized
        relative to the space already left of the sidebar.
      */}
      <main key="app-shell-main" className={cn("min-w-0", authenticated && "lg:ml-60")}>
        <div
          className={cn(
            "max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10",
            authenticated ? "py-6 lg:py-8" : "py-8 sm:py-10"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
