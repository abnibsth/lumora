"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Handshake,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Calendar,
  Info,
  Sparkles,
  User,
  Store,
  Tag,
  Briefcase,
  Layers,
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
import { cleanSeeking, cleanBmc } from "@/lib/profile-presentation";
import { PRESET_PARTNERSHIP_NEEDS } from "@/components/dashboard/partnership-workspace";
import { BusinessMonogram } from "@/components/business/business-monogram";
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

interface BusinessPartnershipsViewProps {
  overview?: AdminOverview;
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

const PARTNERSHIPS_PER_PAGE = 10;

export default function BusinessPartnershipsView({
  overview,
}: BusinessPartnershipsViewProps = {}) {
  const metrics = overview?.metrics;

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedNeed, setSelectedNeed] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Data & Request State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request ID Ref to prevent race conditions from stale responses
  const requestIdRef = useRef(0);

  // Drawer Detail State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
        limit: PARTNERSHIPS_PER_PAGE,
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
          : "Gagal memuat katalog peluang kemitraan dari server."
      );
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedSearch, selectedCategory, page]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  // Handle drawer detail loading
  const openDetailDrawer = async (business: Business) => {
    setSelectedBusiness(business);
    setDrawerOpen(true);
    setDetailLoading(true);

    try {
      // Re-fetch by slug to guarantee latest full profile (including BMC entries)
      const data = await fetchBusinessBySlug(business.slug);
      if (data) {
        setSelectedBusiness(data);
      }
    } catch {
      // Keep existing business object if slug fetch fails
    } finally {
      setDetailLoading(false);
    }
  };

  // Filter items client-side by seeking needs
  const displayedBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const cleanedNeeds = cleanSeeking(b.seeking);

      if (selectedNeed === "has_seeking") {
        return cleanedNeeds.length > 0;
      }
      if (selectedNeed !== "all") {
        return cleanedNeeds.some(
          (need) => need.toLowerCase() === selectedNeed.toLowerCase()
        );
      }
      return true;
    });
  }, [businesses, selectedNeed]);

  // Active page statistics (strictly calculated from current loaded page items)
  const pageStats = useMemo(() => {
    let withSeekingCount = 0;
    let totalSeekingTags = 0;
    let withObjectiveCount = 0;

    businesses.forEach((b) => {
      const cleaned = cleanSeeking(b.seeking);
      if (cleaned.length > 0) {
        withSeekingCount++;
        totalSeekingTags += cleaned.length;
      }
      if (b.seekingObjective && b.seekingObjective.trim().length > 0) {
        withObjectiveCount++;
      }
    });

    return {
      withSeekingCount,
      totalSeekingTags,
      withObjectiveCount,
    };
  }, [businesses]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PARTNERSHIPS_PER_PAGE));

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("Semua");
    setSelectedNeed("all");
    setPage(1);
  };

  // Drawer BMC entries cleaned
  const drawerBmc = useMemo(() => {
    return cleanBmc(selectedBusiness?.bmc);
  }, [selectedBusiness]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Title Section */}
      <header className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#123f32]/10 px-2.5 py-0.5 font-semibold text-[#123f32]">
                <Handshake className="size-3" />
                Peluang & Mitra
              </span>
              <span className="inline-flex items-center gap-1 text-[#526059]">
                • Kebutuhan Kemitraan Profil Terbit
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
              Katalog Peluang & Kemitraan UMKM
            </h1>
            <p className="mt-1 text-xs text-[#526059] sm:text-sm max-w-3xl">
              Tinjau kebutuhan kerja sama bisnis, target kemitraan, dan peluang sinergi yang dicari oleh UMKM terdaftar di platform LUMORA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="admin-partnerships-refresh"
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

        {/* 2. Metrics & Stat Cards (Strictly Transparent & Non-fabricated) */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-5 border-t border-[#d8d8cf]/60">
          {/* Stat 1: Pengguna Mitra (Platform Overview) */}
          <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#526059]">
              <span>Pengguna Mitra (Platform)</span>
              <Handshake className="size-3.5 text-[#123f32]" />
            </div>
            <p className="mt-2 text-xl font-bold text-[#123f32]">
              {metrics
                ? formatNumber(metrics.totalMitraUsers)
                : "—"}
            </p>
            <p className="text-[11px] text-[#71827a] mt-0.5">
              Akun mitra terdaftar di platform
            </p>
          </div>

          {/* Stat 2: Total Profil Terbit (Platform Overview) */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span>Profil Terbit (Platform)</span>
              <Store className="size-3.5 text-emerald-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-950">
              {metrics
                ? formatNumber(metrics.publishedBusinesses)
                : formatNumber(totalCount)}
            </p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              Total UMKM aktif di direktori publik
            </p>
          </div>

          {/* Stat 3: Total Sesuai Filter Server */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-blue-800">
              <span>Katalog Terfilter (Server)</span>
              <CheckCircle2 className="size-3.5 text-blue-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-blue-950">
              {formatNumber(totalCount)}
            </p>
            <p className="text-[11px] text-blue-700/80 mt-0.5">
              Profil sesuai kueri & kategori
            </p>
          </div>

          {/* Stat 4: Membuka Peluang (Halaman Aktif) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span>Membuka Peluang</span>
              <Sparkles className="size-3.5 text-amber-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-amber-950">
              {pageStats.withSeekingCount}
              <span className="text-xs font-normal text-amber-700/80 ml-1.5">
                / {businesses.length}
              </span>
            </p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">
              {pageStats.totalSeekingTags} tag kemitraan di halaman aktif
            </p>
          </div>
        </div>
      </header>

      {/* 3. Search & Filter Bar */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#71827a]" />
            <input
              id="admin-partnerships-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama usaha atau lokasi..."
              className="w-full rounded-xl border border-[#d8d8cf] bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm text-[#123f32] placeholder-[#71827a] outline-hidden focus:border-[#123f32] focus:ring-2 focus:ring-[#123f32]/10 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#71827a] hover:bg-[#e7efe9] hover:text-[#123f32]"
                aria-label="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter: All vs Has Seeking */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex rounded-xl border border-[#d8d8cf] bg-white p-1 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setSelectedNeed("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedNeed === "all"
                    ? "bg-[#123f32] text-white"
                    : "text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
                }`}
              >
                Semua Profil
              </button>
              <button
                type="button"
                onClick={() => setSelectedNeed("has_seeking")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedNeed === "has_seeking"
                    ? "bg-[#123f32] text-white"
                    : "text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
                }`}
              >
                <Handshake className="size-3" />
                <span>Ada Kebutuhan Mitra</span>
              </button>
            </div>

            {(debouncedSearch || selectedCategory !== "Semua" || selectedNeed !== "all") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#d8d8cf] bg-white px-3 py-2 text-xs font-medium text-[#71827a] hover:bg-[#e7efe9] hover:text-[#123f32] transition-colors"
                title="Reset semua filter"
              >
                <X className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Helper Notice */}
        <p className="text-[11px] text-[#71827a]">
          *Pencarian server mencocokkan nama dan deskripsi usaha. Tag kebutuhan mitra dapat difilter melalui pilihan filter di bawah.
        </p>

        {/* Partnership Needs Tag Selector (Preset Filters) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-[#526059] shrink-0">
            <Tag className="size-3" />
            Jenis Kemitraan:
          </span>
          {PRESET_PARTNERSHIP_NEEDS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setSelectedNeed((prev) => (prev === preset ? "all" : preset));
              }}
              className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedNeed === preset
                  ? "bg-[#123f32] text-[#b7df68] shadow-2xs font-semibold"
                  : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
              }`}
            >
              <Handshake className="size-3" />
              <span>{preset}</span>
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#d8d8cf]/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-[#526059] shrink-0">
            <Filter className="size-3" />
            Kategori:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("Semua");
              setPage(1);
            }}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === "Semua"
                ? "bg-[#123f32] text-white shadow-2xs"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            Semua Kategori
          </button>
          {BUSINESS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-[#123f32] text-white shadow-2xs"
                  : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Main Opportunities & Partnerships Table Section */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-xs overflow-hidden">
        {/* Error State */}
        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-semibold">
                  Terjadi kesalahan memuat katalog peluang kemitraan
                </p>
                <p className="mt-1 text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={() => loadBusinesses()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-900 transition-colors"
                >
                  <RefreshCw className="size-3" />
                  Coba Muat Ulang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f0eee6] border-b border-[#d8d8cf]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[260px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                  Profil UMKM
                </TableHead>
                <TableHead className="w-[150px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                  Kategori & Lokasi
                </TableHead>
                <TableHead className="w-[150px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                  Pemilik Usaha
                </TableHead>
                <TableHead className="min-w-[260px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                  Kebutuhan Kemitraan
                </TableHead>
                <TableHead className="min-w-[240px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                  Tujuan Kerja Sama
                </TableHead>
                <TableHead className="w-[150px] py-3.5 text-right text-xs font-bold uppercase tracking-wider text-[#123f32]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-[#e8e4d9]">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-xl bg-[#e7efe9]" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32 bg-[#e7efe9]" />
                          <Skeleton className="h-3 w-20 bg-[#e7efe9]" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-20 bg-[#e7efe9]" />
                        <Skeleton className="h-3 w-24 bg-[#e7efe9]" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24 bg-[#e7efe9]" />
                        <Skeleton className="h-3 w-16 bg-[#e7efe9]" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-1.5">
                        <Skeleton className="h-6 w-24 rounded-lg bg-[#e7efe9]" />
                        <Skeleton className="h-6 w-20 rounded-lg bg-[#e7efe9]" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-full bg-[#e7efe9]" />
                        <Skeleton className="h-3 w-3/4 bg-[#e7efe9]" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-24 rounded-xl bg-[#e7efe9]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : displayedBusinesses.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="mx-auto max-w-sm space-y-3">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#123f32]/10 text-[#123f32]">
                        <Handshake className="size-6" />
                      </div>
                      <h3 className="text-base font-bold text-[#123f32]">
                        Tidak ada peluang kemitraan ditemukan
                      </h3>
                      <p className="text-xs text-[#526059]">
                        {debouncedSearch ||
                        selectedCategory !== "Semua" ||
                        selectedNeed !== "all"
                          ? "Coba sesuaikan kata kunci pencarian, ubah filter kategori, atau reset filter kebutuhan kemitraan."
                          : "Belum ada profil usaha terbit yang mencantumkan kebutuhan kemitraan di LUMORA."}
                      </p>
                      {(debouncedSearch ||
                        selectedCategory !== "Semua" ||
                        selectedNeed !== "all") && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-white px-3.5 py-2 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors"
                        >
                          <X className="size-3.5" />
                          <span>Reset Semua Filter</span>
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Business Rows
                displayedBusinesses.map((b) => {
                  const cleanedNeeds = cleanSeeking(b.seeking);
                  const hasNeeds = cleanedNeeds.length > 0;
                  const hasObjective = Boolean(
                    b.seekingObjective && b.seekingObjective.trim().length > 0
                  );

                  return (
                    <TableRow
                      key={b.id}
                      className="border-b border-[#e8e4d9] hover:bg-[#f5f2e9]/60 transition-colors"
                    >
                      {/* 1. Identity & Profile */}
                      <TableCell className="py-4 align-top">
                        <div className="flex items-start gap-3">
                          {b.logo ? (
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-[#d8d8cf] bg-white shadow-2xs">
                              <Image
                                src={b.logo}
                                alt={b.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <BusinessMonogram
                              name={b.name}
                              className="size-10 text-sm rounded-xl shadow-2xs"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openDetailDrawer(b)}
                                className="font-bold text-sm text-[#123f32] hover:underline text-left truncate"
                              >
                                {b.name}
                              </button>
                              {b.verified && (
                                <ShieldCheck
                                  className="size-4 shrink-0 text-[#123f32]"
                                  title="Profil Terverifikasi LUMORA"
                                />
                              )}
                            </div>
                            <p className="text-xs text-[#71827a] font-mono truncate">
                              /{b.slug}
                            </p>
                            {Boolean(b.foundedYear && b.foundedYear > 0) && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#526059] mt-0.5">
                                <Calendar className="size-3 text-[#123f32]/60" />
                                Berdiri {b.foundedYear}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Category & Location */}
                      <TableCell className="py-4 align-top">
                        <div className="space-y-1.5">
                          <Badge
                            variant="outline"
                            className="border-[#123f32]/20 bg-[#e7efe9] text-[#123f32] font-semibold text-[11px]"
                          >
                            {b.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-[#526059]">
                            <MapPin className="size-3 shrink-0 text-[#123f32]/60" />
                            <span className="truncate">
                              {b.location || "Lokasi belum dicantumkan"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Owner Profile */}
                      <TableCell className="py-4 align-top">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-[#123f32] truncate">
                            {b.owner?.name || "Nama belum diisi"}
                          </p>
                          <p className="text-[11px] text-[#526059] truncate">
                            {b.owner?.role || "Pemilik Usaha"}
                          </p>
                        </div>
                      </TableCell>

                      {/* 4. Partnership Needs (Seeking Tags) */}
                      <TableCell className="py-4 align-top">
                        {hasNeeds ? (
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {cleanedNeeds.map((need, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-md bg-[#e7efe9] border border-[#123f32]/15 px-2 py-0.5 text-[11px] font-medium text-[#123f32]"
                              >
                                <Handshake className="size-2.5 text-[#123f32]/70 shrink-0" />
                                <span>{need}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#8a9891] italic">
                            <Info className="size-3 shrink-0" />
                            <span>Belum ada kebutuhan spesifik</span>
                          </span>
                        )}
                      </TableCell>

                      {/* 5. Objective Excerpt */}
                      <TableCell className="py-4 align-top">
                        {hasObjective ? (
                          <p className="line-clamp-2 text-xs leading-relaxed text-[#2d3832]">
                            {b.seekingObjective}
                          </p>
                        ) : (
                          <span className="text-xs text-[#8a9891] italic">
                            Belum dicantumkan
                          </span>
                        )}
                      </TableCell>

                      {/* 6. Actions */}
                      <TableCell className="py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            id={`admin-partner-detail-${b.slug}`}
                            onClick={() => openDetailDrawer(b)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors shadow-2xs"
                            title="Buka detail peluang kemitraan"
                          >
                            <Eye className="size-3.5" />
                            <span className="hidden sm:inline">Detail Mitra</span>
                          </button>
                          <Link
                            href={`${ROUTES.business(b.slug)}#kolaborasi`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-xl border border-[#d8d8cf] bg-white p-1.5 text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32] transition-colors shadow-2xs"
                            title="Buka profil publik bagian kolaborasi di tab baru"
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="flex flex-col gap-3 border-t border-[#d8d8cf] bg-[#f0eee6]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#526059]">
            Menampilkan{" "}
            <span className="font-semibold text-[#123f32]">
              {displayedBusinesses.length}
            </span>{" "}
            profil di halaman ini dari total{" "}
            <span className="font-semibold text-[#123f32]">{totalCount}</span>{" "}
            profil terbit.
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#526059] mr-2">
              Halaman {page} dari {totalPages}
            </span>
            <button
              type="button"
              id="admin-partnerships-prev-page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              id="admin-partnerships-next-page"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] disabled:opacity-40 transition-colors shadow-2xs"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Detail Drawer: Partnership Opportunities & Profile */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto bg-[#fbfaf6] p-0 border-l border-[#d8d8cf]"
        >
          {selectedBusiness && (
            <div className="divide-y divide-[#d8d8cf]">
              {/* Drawer Top Header */}
              <div className="p-6 bg-[#f0eee6]/60">
                <SheetHeader className="text-left space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {selectedBusiness.logo ? (
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[#d8d8cf] bg-white shadow-xs">
                          <Image
                            src={selectedBusiness.logo}
                            alt={selectedBusiness.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <BusinessMonogram
                          name={selectedBusiness.name}
                          className="size-14 text-xl rounded-2xl shadow-xs"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <SheetTitle className="text-xl font-bold text-[#123f32]">
                            {selectedBusiness.name}
                          </SheetTitle>
                          {selectedBusiness.verified && (
                            <Badge className="bg-[#123f32] text-[#b7df68] text-[10px] gap-1 px-2 py-0.5">
                              <ShieldCheck className="size-3" />
                              Terverifikasi
                            </Badge>
                          )}
                        </div>
                        <SheetDescription className="text-xs text-[#526059] font-mono mt-0.5">
                          /{selectedBusiness.slug}
                        </SheetDescription>
                      </div>
                    </div>

                    <Link
                      href={`${ROUTES.business(selectedBusiness.slug)}#kolaborasi`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#123f32] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0b3027] transition-colors shadow-xs shrink-0"
                    >
                      <span>Lihat Halaman Publik</span>
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>

                  {/* Badges Info Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#d8d8cf]/60">
                    <Badge
                      variant="outline"
                      className="border-[#123f32]/20 bg-[#e7efe9] text-[#123f32] font-semibold text-xs"
                    >
                      {selectedBusiness.category}
                    </Badge>
                    {selectedBusiness.location && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#d8d8cf] bg-white px-2.5 py-1 text-xs text-[#526059]">
                        <MapPin className="size-3 text-[#123f32]" />
                        {selectedBusiness.location}
                      </span>
                    )}
                    {Boolean(
                      selectedBusiness.foundedYear &&
                        selectedBusiness.foundedYear > 0
                    ) && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#d8d8cf] bg-white px-2.5 py-1 text-xs text-[#526059]">
                        <Calendar className="size-3 text-[#123f32]" />
                        Tahun {selectedBusiness.foundedYear}
                      </span>
                    )}
                    {detailLoading && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#71827a] animate-pulse">
                        <RefreshCw className="size-3 animate-spin" />
                        Sinkronisasi data profil...
                      </span>
                    )}
                  </div>
                </SheetHeader>
              </div>

              {/* Drawer Body Sections */}
              <div className="p-6 space-y-8">
                {/* 1. Profil Pemilik Usaha */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    <User className="size-4 text-[#123f32]" />
                    <span>Profil Pemilik Usaha</span>
                  </div>

                  <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[#123f32]">
                        {selectedBusiness.owner?.name || "Nama pemilik belum diisi"}
                      </p>
                      <span className="rounded-md bg-[#e7efe9] px-2 py-0.5 text-xs font-medium text-[#123f32]">
                        {selectedBusiness.owner?.role || "Pemilik Usaha"}
                      </span>
                    </div>
                    {selectedBusiness.owner?.bio ? (
                      <p className="text-xs leading-relaxed text-[#526059] border-t border-[#f0eee6] pt-2">
                        {selectedBusiness.owner?.bio}
                      </p>
                    ) : (
                      <p className="text-xs italic text-[#71827a] border-t border-[#f0eee6] pt-2">
                        Biodata pemilik belum dicantumkan.
                      </p>
                    )}
                  </div>
                </section>

                {/* 2. Deskripsi Usaha */}
                {selectedBusiness.description && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#123f32]">
                      Deskripsi & Pitching Singkat
                    </h3>
                    <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 text-xs sm:text-sm leading-relaxed text-[#2d3832] shadow-2xs">
                      {selectedBusiness.description}
                    </div>
                  </section>
                )}

                {/* 3. Kemitraan yang Sedang Dicari */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    <Handshake className="size-4 text-[#123f32]" />
                    <span>Kemitraan yang Sedang Dicari</span>
                  </div>

                  {cleanSeeking(selectedBusiness.seeking).length > 0 ? (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {cleanSeeking(selectedBusiness.seeking).map((tag, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl border border-[#123f32]/20 bg-[#e7efe9] p-3 text-xs font-semibold text-[#123f32] shadow-2xs"
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#123f32] text-[#b7df68]">
                            <Handshake className="size-3.5" />
                          </div>
                          <span>{tag}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#d8d8cf] bg-white p-6 text-center">
                      <Handshake className="size-6 text-[#71827a] mx-auto" />
                      <p className="mt-2 text-xs font-semibold text-[#123f32]">
                        Belum ada tag kebutuhan kemitraan
                      </p>
                      <p className="mt-1 text-[11px] text-[#526059]">
                        Pemilik usaha belum menentukan kategori mitra yang sedang dicari.
                      </p>
                    </div>
                  )}
                </section>

                {/* 4. Rencana & Tujuan Spesifik (Seeking Objective) */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    <Briefcase className="size-4 text-[#123f32]" />
                    <span>Rencana & Tujuan Spesifik Kerja Sama</span>
                  </div>

                  {selectedBusiness.seekingObjective &&
                  selectedBusiness.seekingObjective.trim().length > 0 ? (
                    <div className="rounded-2xl border border-[#d8d8cf] bg-[#f5f2e9]/70 p-5 shadow-2xs">
                      <p className="text-xs sm:text-sm leading-relaxed text-[#1a2620] whitespace-pre-wrap">
                        {selectedBusiness.seekingObjective}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#d8d8cf] bg-white p-6 text-center">
                      <Info className="size-6 text-[#71827a] mx-auto" />
                      <p className="mt-2 text-xs font-semibold text-[#123f32]">
                        Belum ada deskripsi rencana kerja sama
                      </p>
                      <p className="mt-1 text-[11px] text-[#526059]">
                        Pemilik usaha belum menuliskan narasi rencana spesifik kemitraan.
                      </p>
                    </div>
                  )}
                </section>

                {/* 5. Business Model Canvas (BMC) Terkait Kemitraan */}
                {drawerBmc.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                        <Layers className="size-4 text-[#123f32]" />
                        <span>Korelasi Model Bisnis (BMC)</span>
                      </div>
                      <span className="text-[11px] text-[#71827a]">
                        {drawerBmc.length} Blok BMC Terisi
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {drawerBmc.map((entry, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 text-xs shadow-2xs"
                        >
                          <h4 className="font-bold text-[#123f32] text-[11px] uppercase tracking-wider">
                            {entry.label}
                          </h4>
                          <p className="mt-1 text-xs text-[#526059] leading-relaxed whitespace-pre-wrap">
                            {entry.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 6. Read-Only Notice Box */}
                <div className="rounded-xl border border-[#d8d8cf] bg-[#f0eee6]/50 p-4 text-xs text-[#526059] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#123f32]">
                    <Info className="size-3.5 text-[#123f32]" />
                    <span>Kebijakan Read-Only CMS Admin</span>
                  </div>
                  <p className="leading-relaxed">
                    Data kebutuhan kemitraan dikelola secara mandiri oleh pemilik akun UMKM melalui profil bisnis mereka. Saat ini belum tersedia kontrak API backend untuk pengajuan proposal kemitraan langsung atau perpesanan administratif.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
