"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Store,
  Search,
  Building2,
  Filter,
  ArrowUpRight,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Users,
  MapPin,
  Calendar,
  Layers,
  Info,
} from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  type Business,
} from "@/types/business";
import {
  fetchBusinesses,
  fetchBusinessBySlug,
  type AdminOverview,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BusinessManagementViewProps {
  overview?: AdminOverview;
  initialFilter?: string | null;
  onClearFilter?: () => void;
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

export default function BusinessManagementView({
  overview,
  initialFilter,
  onClearFilter,
}: BusinessManagementViewProps) {
  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "unverified" | "verified"
  >(initialFilter === "unverified" ? "unverified" : "all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & Request State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request ID Ref to prevent race conditions from stale responses
  const requestIdRef = useRef(0);

  // Drawer Detail State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detailBusiness, setDetailBusiness] = useState<Business | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Sync initialFilter prop if changed
  const [prevInitialFilter, setPrevInitialFilter] = useState(initialFilter);
  if (initialFilter !== prevInitialFilter) {
    setPrevInitialFilter(initialFilter);
    if (initialFilter === "unverified") {
      setVerificationFilter("unverified");
      setPage(1);
    }
  }

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch businesses list with safe sequencing
  const loadBusinesses = useCallback(async () => {
    requestIdRef.current += 1;
    const currentId = requestIdRef.current;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    try {
      const res = await fetchBusinesses({
        q: debouncedSearch.trim() || undefined,
        category: selectedCategory !== "Semua" ? selectedCategory : undefined,
        page,
        limit,
      });

      // Ignore stale response if a newer query was launched
      if (currentId !== requestIdRef.current) return;

      setBusinesses(res.items);
      setTotalCount(res.total);
    } catch (err: unknown) {
      if (currentId !== requestIdRef.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat direktori bisnis dari server."
      );
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, selectedCategory, page, limit]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  // Handle drawer detail loading
  const openDetailDrawer = async (slug: string) => {
    setSelectedSlug(slug);
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailBusiness(null);

    try {
      const data = await fetchBusinessBySlug(slug);
      if (!data) {
        throw new Error("Profil bisnis tidak ditemukan atau telah diarsipkan.");
      }
      setDetailBusiness(data);
    } catch (err: unknown) {
      setDetailError(
        err instanceof Error ? err.message : "Gagal memuat detail profil UMKM."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // Filter items client-side by verification status
  const displayedBusinesses = businesses.filter((b) => {
    if (verificationFilter === "unverified") return !b.verified;
    if (verificationFilter === "verified") return !!b.verified;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("Semua");
    setVerificationFilter("all");
    setPage(1);
    if (onClearFilter) onClearFilter();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Title Section */}
      <header className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#123f32]/10 px-2.5 py-0.5 font-semibold text-[#123f32]">
                <Store className="size-3" />
                Manajemen UMKM
              </span>
              <span className="inline-flex items-center gap-1 text-[#526059]">
                • Direktori Profil Terdaftar
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
              Direktori & Manajemen UMKM
            </h1>
            <p className="mt-1 text-xs text-[#526059] sm:text-sm max-w-3xl">
              Pantau profil usaha terdaftar, periksa kelengkapan Business Model
              Canvas (BMC), dan tinjau status kurasi profil di platform LUMORA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="admin-umkm-refresh"
              onClick={() => loadBusinesses()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#123f32] transition-colors hover:bg-[#e7efe9] disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw
                className={`size-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* 2. Official Metrics Stat Cards */}
        {overview?.metrics && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-5 border-t border-[#d8d8cf]/60">
            {/* Stat 1: Total Profil Terdaftar */}
            <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#526059]">
                <span>Total Profil</span>
                <Building2 className="size-3.5 text-[#123f32]" />
              </div>
              <p className="mt-2 text-xl font-bold text-[#123f32]">
                {formatNumber(overview.metrics.totalBusinesses)}
              </p>
              <p className="text-[11px] text-[#71827a] mt-0.5">
                Profil non-arsip di DB
              </p>
            </div>

            {/* Stat 2: Profil Terbit */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-emerald-800">
                <span>Profil Terbit</span>
                <CheckCircle2 className="size-3.5 text-emerald-700" />
              </div>
              <p className="mt-2 text-xl font-bold text-emerald-950">
                {formatNumber(overview.metrics.publishedBusinesses)}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Tampil di Discovery Hub
              </p>
            </div>

            {/* Stat 3: Terbit Belum Terverifikasi */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span>Terbit Belum Terverifikasi</span>
                <ShieldAlert className="size-3.5 text-amber-700" />
              </div>
              <p className="mt-2 text-xl font-bold text-amber-950">
                {formatNumber(overview.metrics.unverifiedPublishedBusinesses)}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Menunggu kurasi admin
              </p>
            </div>

            {/* Stat 4: Akun Pelaku UMKM */}
            <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-[#526059]">
                <span>Akun Pelaku UMKM</span>
                <Users className="size-3.5 text-[#123f32]" />
              </div>
              <p className="mt-2 text-xl font-bold text-[#123f32]">
                {formatNumber(overview.metrics.totalUmkmUsers)}
              </p>
              <p className="text-[11px] text-[#71827a] mt-0.5">
                Pengguna terdaftar role UMKM
              </p>
            </div>
          </div>
        )}
      </header>

      {/* 3. Toolbar: Search, Category Filter, and Verification Status */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-2xs sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#71827a]" />
            <input
              id="admin-umkm-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama bisnis, kategori, atau kota..."
              className="w-full rounded-xl border border-[#d8d8cf] bg-white py-2 pl-9 pr-8 text-xs font-medium text-[#123f32] placeholder:text-[#71827a] focus:border-[#123f32] focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71827a] hover:text-[#123f32]"
                aria-label="Hapus kata kunci pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Kurasi Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#526059] font-medium mr-1 flex items-center gap-1">
              <Filter className="size-3" />
              Kurasi:
            </span>
            <button
              type="button"
              onClick={() => {
                setVerificationFilter("all");
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                verificationFilter === "all"
                  ? "bg-[#123f32] text-white"
                  : "bg-white text-[#526059] border border-[#d8d8cf] hover:bg-[#e7efe9]"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => {
                setVerificationFilter("unverified");
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                verificationFilter === "unverified"
                  ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                  : "bg-white text-[#526059] border border-[#d8d8cf] hover:bg-[#e7efe9]"
              }`}
            >
              Terbit Belum Terverifikasi
            </button>
            <button
              type="button"
              onClick={() => {
                setVerificationFilter("verified");
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                verificationFilter === "verified"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold"
                  : "bg-white text-[#526059] border border-[#d8d8cf] hover:bg-[#e7efe9]"
              }`}
            >
              Terverifikasi
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#e7efe9] text-xs">
          <span className="text-[#71827a] mr-1">Kategori:</span>
          {["Semua", ...BUSINESS_CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  isSelected
                    ? "bg-[#b7df68]/40 text-[#123f32] font-bold border border-[#b7df68]"
                    : "bg-white text-[#4a5550] border border-[#d8d8cf] hover:bg-[#e7efe9]"
                }`}
              >
                {cat}
              </button>
            );
          })}

          {(searchTerm ||
            selectedCategory !== "Semua" ||
            verificationFilter !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:underline"
            >
              <X className="size-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </section>

      {/* 4. Table Section */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-white shadow-xs overflow-hidden">
        {/* Error Alert State */}
        {error && (
          <div className="m-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadBusinesses()}
              className="font-bold underline hover:no-underline"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Table Content */}
        <Table>
          <TableHeader className="bg-[#fbfaf6] text-[#123f32] text-xs border-b border-[#d8d8cf]">
            <TableRow>
              <TableHead className="w-[30%] py-3.5 pl-6 font-bold">
                Profil & Identitas Usaha
              </TableHead>
              <TableHead className="w-[20%] py-3.5 font-bold">
                Kategori & Domisili
              </TableHead>
              <TableHead className="w-[20%] py-3.5 font-bold">
                Pemilik Usaha
              </TableHead>
              <TableHead className="w-[15%] py-3.5 font-bold">
                Status Publikasi & Kurasi
              </TableHead>
              <TableHead className="w-[15%] py-3.5 pr-6 text-right font-bold">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="text-xs divide-y divide-[#d8d8cf]/60">
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-xl bg-[#e7efe9]" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-32 bg-[#e7efe9]" />
                        <Skeleton className="h-2.5 w-24 bg-[#e7efe9]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-3.5 w-20 bg-[#e7efe9]" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-3.5 w-28 bg-[#e7efe9]" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-5 w-24 rounded-full bg-[#e7efe9]" />
                  </TableCell>
                  <TableCell className="py-4 pr-6 text-right">
                    <Skeleton className="ml-auto h-7 w-20 rounded-lg bg-[#e7efe9]" />
                  </TableCell>
                </TableRow>
              ))
            ) : displayedBusinesses.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="mx-auto max-w-sm space-y-3">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#f5f2e9] text-[#123f32]">
                      <Store className="size-6 text-[#526059]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#123f32]">
                      Tidak Ada Profil Bisnis Ditemukan
                    </h3>
                    <p className="text-xs text-[#526059] leading-relaxed">
                      {searchTerm ||
                      selectedCategory !== "Semua" ||
                      verificationFilter !== "all"
                        ? "Tidak ada UMKM yang cocok dengan filter atau kata kunci saat ini. Silakan coba sesuaikan pencarian."
                        : "Belum ada profil bisnis yang terbit pada direktori publik saat ini."}
                    </p>
                    {(searchTerm ||
                      selectedCategory !== "Semua" ||
                      verificationFilter !== "all") && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9]"
                      >
                        Reset Semua Filter
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              displayedBusinesses.map((biz) => (
                <TableRow
                  key={biz.id}
                  className="hover:bg-[#fbfaf6]/80 transition-colors"
                >
                  {/* Column 1: Usaha */}
                  <TableCell className="py-3.5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] flex items-center justify-center font-bold text-[#123f32]">
                        {biz.coverImage ? (
                          <Image
                            src={biz.coverImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <span>{biz.name.slice(0, 1)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#123f32] truncate">
                          {biz.name}
                        </p>
                        <p className="text-[11px] text-[#71827a] font-mono truncate">
                          /business/{biz.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Column 2: Kategori & Domisili */}
                  <TableCell className="py-3.5">
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-md border border-[#d8d8cf] bg-[#fbfaf6] px-2 py-0.5 text-[10px] font-semibold text-[#123f32]">
                        {biz.category}
                      </span>
                      <p className="text-[11px] text-[#526059] flex items-center gap-1">
                        <MapPin className="size-3 text-[#71827a]" />
                        <span>{biz.location || "Lokasi belum diisi"}</span>
                      </p>
                    </div>
                  </TableCell>

                  {/* Column 3: Pemilik */}
                  <TableCell className="py-3.5">
                    <div>
                      <p className="font-semibold text-[#14382f]">
                        {biz.owner?.name || "Pemilik UMKM"}
                      </p>
                      <p className="text-[11px] text-[#71827a]">
                        {biz.owner?.role || "Founder"}
                      </p>
                    </div>
                  </TableCell>

                  {/* Column 4: Status Publikasi & Kurasi */}
                  <TableCell className="py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Published
                      </span>
                      {biz.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                          <ShieldCheck className="size-3 text-emerald-700" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                          <ShieldAlert className="size-3 text-amber-700" />
                          Terbit Belum Terverifikasi
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Column 5: Aksi */}
                  <TableCell className="py-3.5 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        id={`admin-umkm-view-${biz.slug}`}
                        onClick={() => openDetailDrawer(biz.slug)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d8d8cf] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors"
                        title="Buka ringkasan profil UMKM"
                      >
                        <Eye className="size-3.5" />
                        <span>Detail</span>
                      </button>

                      <Link
                        id={`admin-umkm-public-${biz.slug}`}
                        href={ROUTES.business(biz.slug)}
                        target="_blank"
                        className="inline-flex items-center justify-center size-7 rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32] transition-colors"
                        title="Lihat halaman publik bisnis"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 5. Pagination Controller */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#d8d8cf] px-6 py-4 bg-[#fbfaf6] text-xs">
          <div className="text-[#526059]">
            Menampilkan{" "}
            <strong>
              {displayedBusinesses.length > 0
                ? (page - 1) * limit + 1
                : 0}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(page * limit, totalCount)}
            </strong>{" "}
            dari <strong>{totalCount}</strong> profil terbit
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="admin-umkm-prev"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-[#d8d8cf] bg-white px-3 py-1.5 font-semibold text-[#123f32] hover:bg-[#e7efe9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </button>

            <span className="font-semibold text-[#123f32] px-1">
              Halaman {page} dari {totalPages}
            </span>

            <button
              type="button"
              id="admin-umkm-next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-[#d8d8cf] bg-white px-3 py-1.5 font-semibold text-[#123f32] hover:bg-[#e7efe9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Profile Detail Drawer (Sheet) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl bg-[#fbfaf6] p-0 flex flex-col h-full border-l border-[#d8d8cf] overflow-hidden"
        >
          {/* Drawer Header */}
          <SheetHeader className="p-5 sm:p-6 border-b border-[#d8d8cf] bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#123f32]/10 px-2 py-0.5 text-[10px] font-bold text-[#123f32]">
                  Informasi Profil Usaha
                </span>
                <SheetTitle className="text-xl font-bold text-[#123f32] mt-1.5">
                  {detailLoading
                    ? "Memuat Profil..."
                    : detailBusiness?.name || "Detail Bisnis"}
                </SheetTitle>
                <SheetDescription className="text-xs text-[#526059]">
                  {detailBusiness?.category} · {detailBusiness?.location || "-"}
                </SheetDescription>
              </div>

              {detailBusiness && (
                <Link
                  href={ROUTES.business(detailBusiness.slug)}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors"
                >
                  <span>Buka Halaman</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              )}
            </div>
          </SheetHeader>

          {/* Drawer Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-2xl bg-[#e7efe9]" />
                <Skeleton className="h-6 w-48 bg-[#e7efe9]" />
                <Skeleton className="h-20 w-full bg-[#e7efe9]" />
                <Skeleton className="h-32 w-full bg-[#e7efe9]" />
              </div>
            ) : detailError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="size-4 text-red-600" />
                  Gagal Memuat Detail
                </p>
                <p>{detailError}</p>
                <button
                  type="button"
                  onClick={() => selectedSlug && openDetailDrawer(selectedSlug)}
                  className="font-bold underline"
                >
                  Coba lagi
                </button>
              </div>
            ) : detailBusiness ? (
              <div className="space-y-6 text-xs text-[#14382f]">
                {/* Cover Banner if available */}
                {detailBusiness.coverImage && (
                  <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-[#d8d8cf] shadow-2xs">
                    <Image
                      src={detailBusiness.coverImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="600px"
                    />
                  </div>
                )}

                {/* Status Badges & Year */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#123f32] text-white">
                    {detailBusiness.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#d8d8cf] bg-white text-[#123f32]"
                  >
                    Tahun Berdiri: {detailBusiness.foundedYear || "-"}
                  </Badge>
                  {detailBusiness.verified ? (
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300">
                      Terverifikasi
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                      Terbit Belum Terverifikasi
                    </Badge>
                  )}
                </div>

                {/* Elevator Pitch & Story */}
                <div className="rounded-2xl border border-[#d8d8cf] bg-white p-4 space-y-2 shadow-2xs">
                  <h4 className="font-bold text-[#123f32] text-sm flex items-center gap-1.5">
                    <Info className="size-4 text-[#123f32]" />
                    Deskripsi & Cerita Usaha
                  </h4>
                  <p className="leading-relaxed text-[#4a5550]">
                    {detailBusiness.description || "Belum ada deskripsi singkat."}
                  </p>
                  {detailBusiness.story && (
                    <div className="pt-2 border-t border-[#e7efe9] mt-2">
                      <p className="font-semibold text-[#123f32] mb-1">
                        Cerita Pendirian:
                      </p>
                      <p className="leading-relaxed text-[#526059] italic">
                        &quot;{detailBusiness.story}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Owner Information */}
                {detailBusiness.owner && (
                  <div className="rounded-2xl border border-[#d8d8cf] bg-white p-4 space-y-2 shadow-2xs">
                    <h4 className="font-bold text-[#123f32] text-sm flex items-center gap-1.5">
                      <Users className="size-4 text-[#123f32]" />
                      Identitas Pemilik Usaha
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[#71827a] block">Nama:</span>
                        <strong className="text-[#123f32]">
                          {detailBusiness.owner.name || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#71827a] block">Peran:</span>
                        <strong className="text-[#123f32]">
                          {detailBusiness.owner.role || "-"}
                        </strong>
                      </div>
                    </div>
                    {detailBusiness.owner.bio && (
                      <p className="text-[11px] text-[#526059] pt-1 leading-relaxed">
                        {detailBusiness.owner.bio}
                      </p>
                    )}
                  </div>
                )}

                {/* Seeking (Kemitraan) if available */}
                {detailBusiness.seeking && detailBusiness.seeking.length > 0 && (
                  <div className="rounded-2xl border border-[#d8d8cf] bg-white p-4 space-y-2 shadow-2xs">
                    <h4 className="font-bold text-[#123f32] text-sm flex items-center gap-1.5">
                      <Sparkles className="size-4 text-[#123f32]" />
                      Kebutuhan Kemitraan
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {detailBusiness.seeking.map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[#b7df68]/30 border border-[#b7df68]/70 px-2 py-0.5 text-[11px] font-semibold text-[#123f32]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    {detailBusiness.seekingObjective && (
                      <p className="text-[11px] text-[#526059] mt-2">
                        Tujuan: {detailBusiness.seekingObjective}
                      </p>
                    )}
                  </div>
                )}

                {/* Business Model Canvas (BMC) */}
                <div className="rounded-2xl border border-[#d8d8cf] bg-white p-4 space-y-3 shadow-2xs">
                  <h4 className="font-bold text-[#123f32] text-sm flex items-center gap-1.5">
                    <Layers className="size-4 text-[#123f32]" />
                    Business Model Canvas (BMC)
                  </h4>
                  {detailBusiness.bmc && detailBusiness.bmc.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {detailBusiness.bmc.map((block, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-[#d8d8cf]/80 bg-[#fbfaf6] p-2.5 space-y-1"
                        >
                          <span className="font-bold text-[#123f32] text-[11px] block">
                            {block.label}
                          </span>
                          <p className="text-[11px] text-[#4a5550] leading-relaxed">
                            {block.value || "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#71827a] italic">
                      Pemilik usaha belum menyusun blok Business Model Canvas.
                    </p>
                  )}
                </div>

                {/* Milestones / Perjalanan */}
                <div className="rounded-2xl border border-[#d8d8cf] bg-white p-4 space-y-3 shadow-2xs">
                  <h4 className="font-bold text-[#123f32] text-sm flex items-center gap-1.5">
                    <Calendar className="size-4 text-[#123f32]" />
                    Catatan Perjalanan Usaha (Milestones)
                  </h4>
                  {detailBusiness.milestones &&
                  detailBusiness.milestones.length > 0 ? (
                    <div className="space-y-3 pt-1 border-l-2 border-[#123f32]/30 ml-2 pl-3">
                      {detailBusiness.milestones.map((m, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className="font-serif italic font-bold text-[#123f32] text-xs">
                            {m.year}
                          </span>
                          <p className="font-semibold text-ink text-xs">
                            {m.title}
                          </p>
                          {m.description && (
                            <p className="text-[11px] text-[#526059] leading-relaxed">
                              {m.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#71827a] italic">
                      Belum ada tonggak perkembangan bisnis yang dicatat.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Drawer Footer Notice */}
          <div className="p-4 border-t border-[#d8d8cf] bg-[#fbfaf6] text-[11px] text-[#71827a] flex items-center justify-between">
            <span>
              ℹ️ Aksi kurasi (approve/reject) menunggu rilis endpoint mutasi
              backend.
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg border border-[#d8d8cf] bg-white px-3 py-1 font-semibold text-[#123f32] hover:bg-[#e7efe9]"
            >
              Tutup
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
