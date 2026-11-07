"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Play,
  Award,
  XCircle,
  Ban,
  Building2,
  Store,
  ArrowRight,
  Loader2,
  MessageSquare,
  FileText,
  UserCheck,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchCollaborationHistory,
  fetchCollaborationHistoryStats,
  fetchCollaborationHistoryDetail,
  startPartnershipApi,
  completePartnershipApi,
  cancelPartnershipApi,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type {
  CollaborationRequest,
  CollaborationHistoryStats,
  CollaborationHistoryDetail,
  CollaborationStatus,
} from "@/types/collaboration";
import type { User } from "@/types/user";

export function PartnerHistoryView({
  user,
  onNavigateToInbox,
  onNavigateToRequests,
}: {
  user: User;
  onNavigateToInbox: (conversationId?: string) => void;
  onNavigateToRequests?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [historyItems, setHistoryItems] = useState<CollaborationRequest[]>([]);
  const [stats, setStats] = useState<CollaborationHistoryStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<CollaborationHistoryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [, startTransition] = useTransition();

  async function loadData() {
    setLoading(true);
    setFeedback(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetchCollaborationHistoryStats(),
        fetchCollaborationHistory({
          status: statusFilter !== "Semua" ? statusFilter : undefined,
          q: searchQuery.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ]);

      if (statsRes.ok && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (listRes.ok && listRes.data) {
        setHistoryItems(listRes.data.items);
      }
    } catch {
      setFeedback({ type: "error", message: "Gagal memuat riwayat kemitraan." });
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
  }, [statusFilter, searchQuery, startDate, endDate]);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    setDetailModalOpen(true);
    const res = await fetchCollaborationHistoryDetail(id);
    setLoadingDetail(false);
    if (res.ok && res.detail) {
      setSelectedDetail(res.detail);
    }
  }

  async function handleStartPartnership(id: string) {
    setActionLoading(true);
    const res = await startPartnershipApi(id);
    setActionLoading(false);
    if (res.ok) {
      setFeedback({ type: "success", message: "Pelaksanaan kemitraan resmi dimulai!" });
      openDetail(id);
      loadData();
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal memulai kemitraan." });
    }
  }

  async function handleCompletePartnership(id: string) {
    setActionLoading(true);
    const res = await completePartnershipApi(id, "Kemitraan selesai dijalankan dengan memuaskan.");
    setActionLoading(false);
    if (res.ok) {
      setFeedback({ type: "success", message: "Kemitraan dinyatakan selesai!" });
      openDetail(id);
      loadData();
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal menyelesaikan kemitraan." });
    }
  }

  async function handleCancelPartnership(id: string) {
    setActionLoading(true);
    const res = await cancelPartnershipApi(id, "Dibatalkan atas kesepakatan bersama.");
    setActionLoading(false);
    if (res.ok) {
      setFeedback({ type: "success", message: "Kemitraan berhasil dibatalkan." });
      openDetail(id);
      loadData();
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal membatalkan kemitraan." });
    }
  }

  function renderStatusBadge(status: CollaborationStatus) {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-300">
            <Clock className="size-3" />
            <span>Menunggu</span>
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-lime/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest border border-forest/20">
            <CheckCircle2 className="size-3 text-forest" />
            <span>Disetujui</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-900 border border-sky-300">
            <Play className="size-3 text-sky-700" />
            <span>Berlangsung</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900 border border-emerald-300">
            <Award className="size-3 text-emerald-700" />
            <span>Selesai</span>
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
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 border border-stone-200">
            <Ban className="size-3" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-muted border border-line">
            <span>{status}</span>
          </span>
        );
    }
  }

  return (
    <div className="mx-auto max-w-[1160px] space-y-4 sm:space-y-5 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
          <History className="size-3" />
          <span>Dokumentasi Kemitraan</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-forest tracking-tight">
          Riwayat Kemitraan
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Pantau perjalanan dan perkembangan seluruh hubungan kemitraan Anda di LUMORA.
        </p>
      </div>

      {/* Summary KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lime-800">
            Disetujui
          </span>
          <p className="mt-1 text-2xl font-bold text-forest">{stats.accepted}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-800">
            Berlangsung
          </span>
          <p className="mt-1 text-2xl font-bold text-sky-800">{stats.inProgress}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Selesai
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{stats.completed}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3 rounded-xl border border-line bg-surface p-3.5 sm:p-4 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line/60">
          {[
            { id: "Semua", label: "Semua" },
            { id: "pending", label: "Menunggu" },
            { id: "accepted", label: "Disetujui" },
            { id: "in_progress", label: "Berlangsung" },
            { id: "completed", label: "Selesai" },
            { id: "rejected", label: "Ditolak" },
            { id: "cancelled", label: "Dibatalkan" },
          ].map((item) => {
            const active = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-forest text-lime shadow-2xs"
                    : "text-forest hover:bg-soft-green/60"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search & Date Range */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama bisnis atau judul..."
              className="h-9 w-full rounded-lg border border-line bg-white pl-8.5 pr-3 text-xs text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Tanggal Mulai"
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs text-forest focus:border-forest focus:outline-none"
            />
            <span className="text-xs text-muted">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Tanggal Selesai"
              className="h-9 rounded-lg border border-line bg-white px-2.5 text-xs text-forest focus:border-forest focus:outline-none"
            />
            {(startDate || endDate || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-forest underline hover:text-forest-deep"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs font-medium text-forest">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat riwayat kemitraan...</span>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-14 px-4 text-center">
          <History className="size-8 text-muted" />
          <h3 className="mt-3 text-sm font-semibold text-forest">
            Belum Ada Riwayat Kemitraan
          </h3>
          <p className="mt-1 text-xs text-muted max-w-sm">
            Riwayat pengajuan dan perjalanan kerja sama Anda akan muncul di sini seiring aktivitas kemitraan Anda.
          </p>
          <div className="mt-4 flex items-center gap-2">
            {onNavigateToRequests ? (
              <button
                type="button"
                onClick={onNavigateToRequests}
                className={buttonStyles({
                  variant: "secondary",
                  size: "sm",
                })}
              >
                Lihat Permintaan Kolaborasi
              </button>
            ) : null}
            <Link
              href="/dashboard?view=explore"
              className={buttonStyles({
                variant: "primary",
                size: "sm",
                className: "shadow-2xs",
              })}
            >
              Jelajahi UMKM
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item) => {
            const isSender = item.senderUserId === user.id;
            const counterpartyName = isSender ? item.receiverName : item.senderName;
            const counterpartyRole = isSender ? item.receiverRole : item.senderRole;
            const orgName = item.businessName || item.partnerCompanyName || counterpartyName;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3 transition-colors hover:border-forest/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(item.status)}
                      <Badge tone="demo">{item.collaborationTypeLabel}</Badge>
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <Calendar className="size-3" />
                        Diajukan: {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2 className="font-display text-base font-semibold text-forest pt-0.5">
                      {item.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 bg-ivory/60 border border-line/70 px-3 py-1.5 rounded-lg text-xs">
                    {counterpartyRole === "umkm" ? (
                      <Store className="size-4 text-forest shrink-0" />
                    ) : (
                      <Building2 className="size-4 text-forest shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-forest block truncate max-w-44">
                        {orgName}
                      </span>
                      <span className="text-[10.5px] text-muted block">
                        {isSender ? "Pihak Dituju: " : "Pihak Pengaju: "} {counterpartyName}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                  {item.message}
                </p>

                <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    Terakhir diperbarui: {new Date(item.updatedAt || item.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <button
                    type="button"
                    onClick={() => openDetail(item.id)}
                    className={buttonStyles({
                      variant: "secondary",
                      size: "sm",
                      className: "gap-1 font-semibold text-forest hover:bg-soft-green/60",
                    })}
                  >
                    <span>Lihat Detail & Timeline</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL & TIMELINE MODAL */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xl">
          <DialogHeader className="space-y-1 text-left border-b border-line/60 pb-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest w-fit">
              <History className="size-3" />
              <span>Detail & Timeline Kemitraan</span>
            </div>
            <DialogTitle className="font-display text-xl font-semibold text-forest">
              {selectedDetail?.request.title || "Detail Kemitraan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted">
              Dokumentasi resmi perjalanan kerja sama dan riwayat perubahan status di LUMORA.
            </DialogDescription>
          </DialogHeader>

          {loadingDetail || !selectedDetail ? (
            <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-forest" />
              <span>Memuat detail timeline...</span>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {/* Status & Counterparty Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-ivory/50 p-3.5">
                <div>
                  <span className="text-[11px] text-muted block uppercase tracking-wider font-semibold">
                    Status Kemitraan Saat Ini
                  </span>
                  <div className="mt-1">
                    {renderStatusBadge(selectedDetail.request.status)}
                  </div>
                </div>
                <div className="text-xs sm:text-right">
                  <span className="text-[11px] text-muted block">Mitra Terhubung</span>
                  <span className="font-semibold text-forest">
                    {selectedDetail.request.businessName ||
                      selectedDetail.request.partnerCompanyName ||
                      selectedDetail.request.receiverName}
                  </span>
                </div>
              </div>

              {/* Information Section */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-2.5 text-xs">
                <div>
                  <span className="font-semibold text-[11px] uppercase tracking-wider text-muted">
                    Bentuk Kemitraan:
                  </span>
                  <p className="mt-0.5 font-medium text-forest">
                    {selectedDetail.request.collaborationTypeLabel}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-[11px] uppercase tracking-wider text-muted">
                    Pesan Pengantar:
                  </span>
                  <p className="mt-0.5 text-forest whitespace-pre-line leading-relaxed">
                    {selectedDetail.request.message}
                  </p>
                </div>
                {selectedDetail.request.proposalDetail && (
                  <div>
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-muted">
                      Rincian Proposal:
                    </span>
                    <p className="mt-0.5 text-forest whitespace-pre-line leading-relaxed">
                      {selectedDetail.request.proposalDetail}
                    </p>
                  </div>
                )}
              </div>

              {/* TIMELINE PERJALANAN KEMITRAAN */}
              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold text-forest border-b border-line/60 pb-2">
                  Timeline Perjalanan Kemitraan
                </h3>

                {selectedDetail.events.length === 0 ? (
                  <p className="text-xs text-muted">Belum ada catatan aktivitas perubahan status.</p>
                ) : (
                  <ol className="relative border-l border-forest/20 ml-3 space-y-4 pt-1">
                    {selectedDetail.events.map((ev, index) => {
                      const isLast = index === selectedDetail.events.length - 1;
                      return (
                        <li key={ev.id} className="ml-4">
                          <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-white bg-forest" />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span className="font-semibold text-forest">
                              {ev.toStatus === "pending"
                                ? "Pengajuan Kolaborasi Dikirimkan"
                                : ev.toStatus === "accepted"
                                  ? "Pengajuan Kolaborasi Disetujui"
                                  : ev.toStatus === "in_progress"
                                    ? "Pelaksanaan Kemitraan Resmi Dimulai"
                                    : ev.toStatus === "completed"
                                      ? "Kemitraan Dinyatakan Selesai"
                                      : ev.toStatus === "rejected"
                                        ? "Pengajuan Kolaborasi Ditolak"
                                        : "Kemitraan Dibatalkan"}
                            </span>
                            <span className="text-[11px] text-muted">
                              {new Date(ev.createdAt).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })} WIB
                            </span>
                          </div>
                          {ev.reason && (
                            <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                              Catatan: {ev.reason}
                            </p>
                          )}
                          <p className="text-[10px] text-muted/80 mt-0.5">
                            Oleh: {ev.actorName} ({ev.actorRole === "umkm" ? "UMKM" : "Mitra"})
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* ACTION BUTTONS (State advancement) */}
              <div className="pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  {selectedDetail.request.conversationId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        onNavigateToInbox(selectedDetail.request.conversationId);
                      }}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "sm",
                        className: "gap-1.5",
                      })}
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Buka Percakapan Inbox</span>
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {selectedDetail.request.status === "accepted" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStartPartnership(selectedDetail.request.id)}
                      className={buttonStyles({
                        variant: "primary",
                        size: "sm",
                        className: "gap-1.5 font-semibold shadow-2xs",
                      })}
                    >
                      <Play className="size-3.5" />
                      <span>Mulai Pelaksanaan Kemitraan</span>
                    </button>
                  )}

                  {selectedDetail.request.status === "in_progress" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleCompletePartnership(selectedDetail.request.id)}
                      className={buttonStyles({
                        variant: "primary",
                        size: "sm",
                        className: "gap-1.5 font-semibold shadow-2xs",
                      })}
                    >
                      <Award className="size-3.5" />
                      <span>Selesaikan Kemitraan</span>
                    </button>
                  )}

                  {(selectedDetail.request.status === "accepted" ||
                    selectedDetail.request.status === "in_progress") && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleCancelPartnership(selectedDetail.request.id)}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "sm",
                        className: "text-red-700 hover:text-red-800",
                      })}
                    >
                      Batalkan Kemitraan
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

