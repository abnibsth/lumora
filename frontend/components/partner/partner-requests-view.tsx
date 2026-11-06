"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Handshake,
  Inbox,
  Send,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  MessageSquare,
  ArrowRight,
  Loader2,
  Building2,
  Store,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchIncomingCollaborations,
  fetchOutgoingCollaborations,
  fetchCollaborationStats,
  acceptCollaborationApi,
  rejectCollaborationApi,
  withdrawCollaborationApi,
} from "@/lib/api";
import { resolveBusinessCover } from "@/lib/business";
import { ROUTES } from "@/lib/constants";
import type {
  CollaborationRequest,
  CollaborationStats,
  CollaborationStatus,
} from "@/types/collaboration";
import type { User } from "@/types/user";

export function PartnerRequestsView({
  user,
  onNavigateToInbox,
}: {
  user: User;
  onNavigateToInbox: (conversationId?: string) => void;
}) {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [stats, setStats] = useState<CollaborationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [, startTransition] = useTransition();

  async function loadData() {
    setLoading(true);
    setFeedback(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetchCollaborationStats(),
        tab === "incoming"
          ? fetchIncomingCollaborations({
              status: statusFilter !== "Semua" ? statusFilter : undefined,
              q: searchQuery.trim() || undefined,
            })
          : fetchOutgoingCollaborations({
              status: statusFilter !== "Semua" ? statusFilter : undefined,
              q: searchQuery.trim() || undefined,
            }),
      ]);

      if (statsRes.ok && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (listRes.ok && listRes.data) {
        setRequests(listRes.data.items);
      }
    } catch {
      setFeedback({ type: "error", message: "Gagal memuat data kolaborasi." });
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
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tab, statusFilter, searchQuery]);

  async function handleAccept(id: string) {
    setActionPendingId(id);
    const res = await acceptCollaborationApi(id);
    setActionPendingId(null);
    if (!res.ok || !res.request) {
      setFeedback({ type: "error", message: res.error || "Gagal menerima pengajuan." });
      return;
    }
    setFeedback({
      type: "success",
      message: "Pengajuan kolaborasi berhasil diterima! Jalur percakapan Inbox telah dibuka.",
    });
    loadData();
  }

  async function handleReject(id: string) {
    setActionPendingId(id);
    const res = await rejectCollaborationApi(id, "Tidak sesuai kriteria saat ini");
    setActionPendingId(null);
    if (!res.ok) {
      setFeedback({ type: "error", message: res.error || "Gagal menolak pengajuan." });
      return;
    }
    setFeedback({ type: "success", message: "Pengajuan kolaborasi telah ditolak." });
    loadData();
  }

  async function handleWithdraw(id: string) {
    setActionPendingId(id);
    const res = await withdrawCollaborationApi(id);
    setActionPendingId(null);
    if (!res.ok) {
      setFeedback({ type: "error", message: res.error || "Gagal menarik pengajuan." });
      return;
    }
    setFeedback({ type: "success", message: "Pengajuan kolaborasi berhasil ditarik." });
    loadData();
  }

  function renderStatusBadge(status: CollaborationStatus) {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-300">
            <Clock className="size-3" />
            <span>Menunggu Respons</span>
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-lime/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest border border-forest/20">
            <CheckCircle2 className="size-3 text-forest" />
            <span>Diterima (Aktif)</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-900 border border-red-200">
            <XCircle className="size-3" />
            <span>Ditolak</span>
          </span>
        );
      case "withdrawn":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 border border-stone-200">
            <Ban className="size-3" />
            <span>Ditarik</span>
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-muted border border-line">
            <span>Kedaluwarsa</span>
          </span>
        );
    }
  }

  return (
    <div className="mx-auto max-w-[1160px] space-y-4 sm:space-y-5 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
          <Handshake className="size-3" />
          <span>Manajemen Kemitraan</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-forest tracking-tight">
          Permintaan Kolaborasi
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Kelola inisiasi kemitraan masuk dan pantau status proposal yang Anda kirimkan kepada pelaku UMKM atau Mitra.
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Total Pengajuan
          </span>
          <p className="mt-1 text-2xl font-bold text-forest">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Menunggu
          </span>
          <p className="mt-1 text-2xl font-bold text-amber-800">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Disetujui
          </span>
          <p className="mt-1 text-2xl font-bold text-forest">{stats.accepted}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Ditolak / Batal
          </span>
          <p className="mt-1 text-2xl font-bold text-muted">{stats.rejected}</p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg p-3 text-xs sm:text-sm font-medium border ${
            feedback.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          {/* Incoming vs Outgoing Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-soft-green/60 border border-forest/15 w-fit">
            <button
              type="button"
              onClick={() => {
                setTab("incoming");
                setStatusFilter("Semua");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === "incoming"
                  ? "bg-forest text-lime shadow-2xs"
                  : "text-forest hover:bg-forest/10"
              }`}
            >
              <Inbox className="size-3.5" />
              <span>Permintaan Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("outgoing");
                setStatusFilter("Semua");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === "outgoing"
                  ? "bg-forest text-lime shadow-2xs"
                  : "text-forest hover:bg-forest/10"
              }`}
            >
              <Send className="size-3.5" />
              <span>Permintaan Terkirim</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul atau mitra..."
              className="h-9 w-full rounded-lg border border-line bg-white pl-8 pr-3 text-xs text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
        </div>

        {/* Status Filters Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["Semua", "pending", "accepted", "rejected", "withdrawn"].map((st) => {
            const active = statusFilter === st;
            const label =
              st === "Semua"
                ? "Semua Status"
                : st === "pending"
                  ? "Menunggu"
                  : st === "accepted"
                    ? "Diterima"
                    : st === "rejected"
                      ? "Ditolak"
                      : "Ditarik";
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-forest text-lime font-semibold shadow-2xs"
                    : "border border-line bg-white text-forest hover:bg-soft-green/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs font-medium text-forest">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat permintaan kolaborasi...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-14 px-4 text-center">
          <Handshake className="size-8 text-muted" />
          <h3 className="mt-3 text-sm font-semibold text-forest">
            {tab === "incoming"
              ? "Belum Ada Permintaan Masuk"
              : "Belum Ada Permintaan Terkirim"}
          </h3>
          <p className="mt-1 text-xs text-muted max-w-sm">
            {tab === "incoming"
              ? "Ketika pihak UMKM atau Mitra mengajukan proposal kolaborasi kepada Anda, pengajuan akan tampil di sini."
              : "Jelajahi UMKM atau profil mitra potensial untuk mulai mengirimkan inisiasi kemitraan resmi."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isPending = actionPendingId === req.id;
            const isExpanded = expandedId === req.id;
            const isIncoming = tab === "incoming";
            const otherPartyName = isIncoming ? req.senderName : req.receiverName;
            const otherPartyRole = isIncoming ? req.senderRole : req.receiverRole;
            const businessCover = resolveBusinessCover(
              req.businessSlug,
              req.businessCoverImage,
              req.businessName,
            );

            return (
              <div
                key={req.id}
                className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5 transition-colors hover:border-forest/40"
              >
                {/* Top Row: Meta info and Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(req.status)}
                      <Badge tone="demo">{req.collaborationTypeLabel}</Badge>
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(req.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2 className="font-display text-base font-semibold text-forest pt-0.5">
                      {req.title}
                    </h2>
                  </div>

                  {/* Counterparty badge / link */}
                  <div className="flex items-center gap-2 sm:self-start bg-ivory/60 border border-line/70 px-3 py-1.5 rounded-lg text-xs">
                    {otherPartyRole === "umkm" ? (
                      <Store className="size-4 text-forest shrink-0" />
                    ) : (
                      <Building2 className="size-4 text-forest shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-forest block truncate max-w-44">
                        {req.businessName || req.partnerCompanyName || otherPartyName}
                      </span>
                      <span className="text-[10.5px] text-muted block">
                        {isIncoming ? "Pengirim: " : "Tujuan: "} {otherPartyName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message preview */}
                <div className="rounded-lg border border-line/60 bg-white p-3 text-xs text-forest leading-relaxed">
                  <p className="font-semibold text-[11px] uppercase tracking-wider text-muted mb-1">
                    Pesan Pengantar:
                  </p>
                  <p className="whitespace-pre-line">{req.message}</p>
                </div>

                {/* Expandable Proposal Detail */}
                {req.proposalDetail && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest hover:underline"
                    >
                      <span>{isExpanded ? "Sembunyikan Rincian Proposal" : "Lihat Rincian Proposal"}</span>
                      {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="rounded-lg border border-forest/15 bg-soft-green/30 p-3 text-xs text-forest whitespace-pre-line">
                        <p className="font-semibold text-[11px] uppercase tracking-wider text-forest/70 mb-1">
                          Rincian Proposal:
                        </p>
                        {req.proposalDetail}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="text-[11px] text-muted">
                    {req.businessSlug ? (
                      <Link
                        href={ROUTES.business(req.businessSlug)}
                        className="inline-flex items-center gap-1 font-semibold text-forest hover:underline"
                      >
                        <MapPin className="size-3" />
                        <span>Profil Bisnis: {req.businessName}</span>
                      </Link>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Incoming Actions */}
                    {isIncoming && req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleReject(req.id)}
                          className={buttonStyles({
                            variant: "secondary",
                            size: "sm",
                            className: "text-red-700 hover:text-red-800",
                          })}
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleAccept(req.id)}
                          className={buttonStyles({
                            variant: "primary",
                            size: "sm",
                            className: "gap-1.5 shadow-2xs font-semibold",
                          })}
                        >
                          {isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          <span>Terima Kemitraan</span>
                        </button>
                      </>
                    )}

                    {/* Outgoing Pending Action */}
                    {!isIncoming && req.status === "pending" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleWithdraw(req.id)}
                        className={buttonStyles({
                          variant: "secondary",
                          size: "sm",
                          className: "text-stone-700 hover:text-red-700",
                        })}
                      >
                        {isPending ? "Memproses..." : "Tarik Pengajuan"}
                      </button>
                    )}

                    {/* Accepted: Unlocked Conversation Trigger */}
                    {req.status === "accepted" && (
                      <button
                        type="button"
                        onClick={() => onNavigateToInbox(req.conversationId)}
                        className={buttonStyles({
                          variant: "primary",
                          size: "sm",
                          className: "gap-1.5 shadow-2xs font-semibold",
                        })}
                      >
                        <MessageSquare className="size-3.5" />
                        <span>Buka Percakapan Inbox</span>
                        <ArrowRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

