"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime, cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []));
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((ns) => ns?.map((n) => ({ ...n, read: true })) ?? null);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((ns) => ns?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-gray-900 font-medium">
          Mark all read
        </button>
      </div>

      {notifications === null && <p className="text-sm text-gray-500">Loading...</p>}
      {notifications?.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}

      <ul className="space-y-2">
        {notifications?.map((n) => {
          const content = (
            <div
              className={cn(
                "bg-white border rounded-lg p-3 text-sm",
                n.read ? "border-gray-200" : "border-gray-400 bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{n.message}</span>
                {!n.read && <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />}
              </div>
              <div className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</div>
            </div>
          );
          return (
            <li key={n.id} onClick={() => !n.read && markRead(n.id)}>
              {n.link ? (
                <Link href={n.link} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
