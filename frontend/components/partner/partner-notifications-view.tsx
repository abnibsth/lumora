"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Handshake,
  MessageSquare,
  History,
  ShieldCheck,
  Clock,
  ArrowRight,
  Loader2,
  Store,
  Building2,
  Filter,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchNotifications,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "@/lib/api";
import type { Notification } from "@/types/notification";
import type { User } from "@/types/user";

export function PartnerNotificationsView({
  user,
  onNavigate,
  onNavigateToInbox,
  onUnreadCountChange,
}: {
  user: User;
  onNavigate: (view: "requests" | "history") => void;
  onNavigateToInbox: (conversationId?: string) => void;
  onUnreadCountChange?: (count: number) => void;
}) {
  const [filterType, setFilterType] = useState<string>("Semua");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [, startTransition] = useTransition();

  async function loadData() {
    setLoading(true);
    try {
      const isUnread = filterType === "unread";
      const actualType =
        filterType === "Semua" || filterType === "unread" ? undefined : filterType;

      const res = await fetchNotifications({
        type: actualType,
        unread: isUnread,
        limit: 50,
      });

      if (res.ok && res.data) {
        setNotifications(res.data.items);
        setUnreadCount(Number(res.data.unreadCount));
        if (onUnreadCountChange) {
          onUnreadCountChange(Number(res.data.unreadCount));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      startTransition(() => {
        if (active) loadData();
      });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filterType]);

  async function handleNotificationClick(n: Notification) {
    if (!n.readAt) {
      await markNotificationReadApi(n.id);
      setNotifications((curr) =>
        curr.map((item) => (item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onUnreadCountChange) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    }

    // Deep-link according to targetType
    if (n.targetType === "conversation") {
      onNavigateToInbox(n.targetId || undefined);
    } else if (n.targetType === "history") {
      onNavigate("history");
    } else if (n.targetType === "collaboration") {
      onNavigate("requests");
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    const res = await markAllNotificationsReadApi();
    setMarkingAll(false);
    if (res.ok) {
      setNotifications((curr) =>
        curr.map((item) => ({ ...item, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "collab_request_created":
        return <Handshake className="size-4 text-forest" />;
      case "collab_request_accepted":
      case "collab_started":
      case "collab_completed":
        return <CheckCircle2 className="size-4 text-emerald-600" />;
      case "collab_request_rejected":
      case "collab_cancelled":
        return <XCircle className="size-4 text-red-600" />;
      case "new_message":
        return <MessageSquare className="size-4 text-forest" />;
      default:
        return <Bell className="size-4 text-forest" />;
    }
  }

  // Group notifications by date
  const now = new Date();
  const todayDate = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toDateString();

  const grouped = {
    today: [] as Notification[],
    yesterday: [] as Notification[],
    thisWeek: [] as Notification[],
    earlier: [] as Notification[],
  };

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  notifications.forEach((n) => {
    const d = new Date(n.createdAt);
    const dStr = d.toDateString();

    if (dStr === todayDate) {
      grouped.today.push(n);
    } else if (dStr === yesterdayDate) {
      grouped.yesterday.push(n);
    } else if (d >= oneWeekAgo) {
      grouped.thisWeek.push(n);
    } else {
      grouped.earlier.push(n);
    }
  });

  function renderGroup(title: string, items: Notification[]) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
          {title}
        </h2>
        <div className="space-y-2">
          {items.map((n) => {
            const isUnread = !n.readAt;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left rounded-xl border p-3.5 sm:p-4 transition-all flex items-start gap-3.5 ${
                  isUnread
                    ? "border-forest/30 bg-soft-green/40 hover:bg-soft-green/60 shadow-2xs"
                    : "border-line bg-surface hover:border-forest/20"
                }`}
              >
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isUnread
                      ? "bg-forest text-lime shadow-2xs"
                      : "bg-ivory border border-line text-muted"
                  }`}
                >
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs sm:text-sm ${isUnread ? "font-bold text-forest" : "font-medium text-forest"}`}>
                      {n.title}
                    </p>
                    <span className="text-[11px] text-muted shrink-0 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </span>
                  </div>

                  <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                    {n.body}
                  </p>

                  {n.actorName && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-forest/80">
                      {n.actorRole === "umkm" ? (
                        <Store className="size-3 text-forest" />
                      ) : (
                        <Building2 className="size-3 text-forest" />
                      )}
                      <span className="font-semibold">{n.actorName}</span>
                    </div>
                  )}
                </div>

                {isUnread && (
                  <span className="size-2 rounded-full bg-forest shrink-0 mt-2" title="Belum dibaca" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1160px] space-y-4 sm:space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
            <Bell className="size-3" />
            <span>Pemberitahuan Aktivitas</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-forest tracking-tight">
            Notifikasi
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Dapatkan informasi terbaru mengenai aktivitas kolaborasi, pesan, dan perkembangan kemitraan Anda.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            disabled={markingAll}
            onClick={handleMarkAllRead}
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "gap-1.5 self-start sm:self-auto font-semibold text-forest",
            })}
          >
            {markingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            <span>Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line">
        {[
          { id: "Semua", label: "Semua" },
          { id: "unread", label: `Belum Dibaca ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
          { id: "collaboration", label: "Kolaborasi" },
          { id: "message", label: "Pesan" },
          { id: "system", label: "Sistem" },
        ].map((tab) => {
          const active = filterType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? "bg-forest text-lime shadow-2xs"
                  : "text-forest hover:bg-soft-green/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs font-medium text-forest">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat notifikasi...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-14 px-4 text-center">
          <Bell className="size-8 text-muted" />
          <h3 className="mt-3 text-sm font-semibold text-forest">
            Tidak Ada Notifikasi
          </h3>
          <p className="mt-1 text-xs text-muted max-w-sm">
            Semua aktivitas terbaru terkait kemitraan dan pesan Anda akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {renderGroup("Hari Ini", grouped.today)}
          {renderGroup("Kemarin", grouped.yesterday)}
          {renderGroup("Minggu Ini", grouped.thisWeek)}
          {renderGroup("Sebelumnya", grouped.earlier)}
        </div>
      )}
    </div>
  );
}

