"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Images,
  Search,
  Filter,
  Upload,
  Copy,
  Check,
  ExternalLink,
  Layers,
  FileText,
  Video,
  Info,
  X,
  LayoutGrid,
  List,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  HardDrive,
  FileCheck2,
} from "lucide-react";
import {
  STATIC_MEDIA_REGISTRY,
  CATEGORY_LABELS,
  formatBytes,
  type MediaAsset,
  type MediaCategory,
} from "@/data/media-registry";
import { uploadMediaApi, type AdminOverview } from "@/lib/api";
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

export default function MediaLibraryView({
  overview: _overview,
}: {
  overview?: AdminOverview;
}) {
  // Session uploads (media uploaded during current user session via uploadMediaApi)
  const [sessionUploads, setSessionUploads] = useState<MediaAsset[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected asset for detail drawer
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Copy URL state (track copied asset ID)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Image load error fallback state
  const [failedImagePaths, setFailedImagePaths] = useState<Record<string, boolean>>({});

  // Combined assets (session uploads at top, followed by static registry)
  const allAssets = useMemo(() => {
    return [...sessionUploads, ...STATIC_MEDIA_REGISTRY];
  }, [sessionUploads]);

  // Statistics based on real verified assets
  const stats = useMemo(() => {
    const totalCount = allAssets.length;
    const totalBytes = allAssets.reduce((acc, curr) => acc + curr.sizeBytes, 0);
    const brandCount = allAssets.filter((a) => a.category === "brand").length;
    const bannerCount = allAssets.filter((a) => a.category === "banner").length;
    const umkmCount = allAssets.filter((a) => a.category === "curated_umkm").length;
    const videoCount = allAssets.filter((a) => a.category === "video").length;
    const sessionUploadCount = sessionUploads.length;

    return {
      totalCount,
      totalBytes: formatBytes(totalBytes),
      brandAndBannerCount: brandCount + bannerCount,
      umkmCount,
      videoCount,
      sessionUploadCount,
    };
  }, [allAssets, sessionUploads]);

  // Filtered assets based on search query and category
  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      // Category filter
      if (selectedCategory !== "all" && asset.category !== selectedCategory) {
        return false;
      }

      // Search filter (name, filename, path, description, usageLocation)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = asset.name.toLowerCase().includes(q);
        const matchesFilename = asset.filename.toLowerCase().includes(q);
        const matchesPath = asset.path.toLowerCase().includes(q);
        const matchesDesc = asset.description.toLowerCase().includes(q);
        const matchesUsage = asset.usageLocation.toLowerCase().includes(q);

        return matchesName || matchesFilename || matchesPath || matchesDesc || matchesUsage;
      }

      return true;
    });
  }, [allAssets, selectedCategory, searchQuery]);

  // Handle file upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Client-side validation: format check
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimes.includes(file.type)) {
      setUploadError("Format file tidak didukung. Pilih berkas JPEG, PNG, WebP, atau GIF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Client-side validation: max size 5 MB
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError("Ukuran file melebihi batas. Maksimal berkas adalah 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadMediaApi(file);

      if (!res.ok || !res.url) {
        throw new Error(res.error || "Gagal mengunggah file ke backend.");
      }

      const newAsset: MediaAsset = {
        id: `upload-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        filename: file.name,
        path: res.url,
        category: "upload",
        mimeType: file.type,
        sizeBytes: file.size,
        description: "Berkas berhasil diunggah pada sesi aktif ini ke penyimpanan server backend.",
        usageLocation: "Dapat disalin dan digunakan pada CMS Beranda atau formulir profil UMKM",
        isStaticRepo: false,
        uploadedAt: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setSessionUploads((prev) => [newAsset, ...prev]);
      setUploadSuccess(`File "${file.name}" berhasil diunggah! URL: ${res.url}`);
      setSelectedAsset(newAsset);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Copy URL to clipboard
  async function handleCopyUrl(asset: MediaAsset) {
    try {
      const fullUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${asset.path}`
          : asset.path;

      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback if clipboard API fails
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#123f32] px-2.5 py-0.5 text-xs font-semibold text-white">
                <Images className="size-3.5" />
                <span>Media Library</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#123f32]/20 bg-[#e7efe9] px-2.5 py-0.5 text-xs font-medium text-[#123f32]">
                <HardDrive className="size-3" />
                <span>Penyimpanan: Hybrid (Lokal & Terunggah)</span>
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
              Katalog & Manajemen Media Platform
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#526059]">
              Kelola dan pantau seluruh aset visual platform LUMORA: identitas brand, banner CMS
              Beranda, kurasi portofolio UMKM, video pengenalan, serta berkas yang diunggah secara
              dinamis melalui backend.
            </p>
          </div>

          {/* Quick Upload Action */}
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              id="admin-media-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={isUploading}
              onChange={handleFileUpload}
              className="sr-only"
            />
            <button
              id="admin-media-upload-btn"
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#123f32] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#0b3027] disabled:opacity-60"
            >
              <Upload className="size-4" />
              <span>{isUploading ? "Mengunggah ke Server..." : "Unggah Media Baru"}</span>
            </button>
          </div>
        </div>

        {/* Upload feedback alerts */}
        {uploadError ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-red-600 hover:text-red-900"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        {uploadSuccess ? (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
      </section>

      {/* 2. Summary Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Assets */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Total Berkas Terdaftar</span>
            <span className="rounded-lg bg-[#e7efe9] p-2 text-[#123f32]">
              <Layers className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {stats.totalCount} <span className="text-sm font-normal text-[#526059]">berkas</span>
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            {stats.sessionUploadCount > 0
              ? `24 repositori statis + ${stats.sessionUploadCount} sesi aktif`
              : "24 berkas diverifikasi di repositori"}
          </p>
        </div>

        {/* Card 2: Total Storage Size */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Estimasi Ukuran Storage</span>
            <span className="rounded-lg bg-[#b7df68]/40 p-2 text-[#123f32]">
              <HardDrive className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {stats.totalBytes}
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Akumulasi byte berkas fisik di sistem
          </p>
        </div>

        {/* Card 3: Brand & Banner Assets */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Identitas Brand & Banner</span>
            <span className="rounded-lg bg-[#e7efe9] p-2 text-[#123f32]">
              <Sparkles className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {stats.brandAndBannerCount}{" "}
            <span className="text-sm font-normal text-[#526059]">aset</span>
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Logo, banner hero, & grafis OpenGraph
          </p>
        </div>

        {/* Card 4: Curated UMKM Assets */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Foto Kurasi Cerita UMKM</span>
            <span className="rounded-lg bg-[#e7efe9] p-2 text-[#123f32]">
              <Images className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {stats.umkmCount} <span className="text-sm font-normal text-[#526059]">aset</span>
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Galeri gerai, pendiri, & workshop usaha
          </p>
        </div>
      </section>

      {/* 3. Controls Bar: Search, Category Filters, View Switcher */}
      <section className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#526059]" />
            <input
              id="admin-media-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama berkas, path, atau kegunaan..."
              className="w-full rounded-xl border border-[#d8d8cf] bg-white py-2 pl-9 pr-9 text-xs text-[#14382f] placeholder:text-[#526059]/70 focus:border-[#123f32] focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526059] hover:text-[#123f32]"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-medium text-[#526059]">Tampilan:</span>
            <div className="inline-flex rounded-lg border border-[#d8d8cf] bg-white p-0.5">
              <button
                id="admin-media-view-grid"
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#123f32] text-white"
                    : "text-[#526059] hover:text-[#123f32]"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>Grid Galeri</span>
              </button>
              <button
                id="admin-media-view-table"
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  viewMode === "table"
                    ? "bg-[#123f32] text-white"
                    : "text-[#526059] hover:text-[#123f32]"
                }`}
              >
                <List className="size-3.5" />
                <span>Tabel Direktori</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#e7efe9]">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-[#526059]">
            <Filter className="size-3" />
            <span>Kategori:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "all"
                ? "bg-[#123f32] text-white"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            Semua Media ({allAssets.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("brand")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "brand"
                ? "bg-[#123f32] text-white"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            Brand & Identitas ({allAssets.filter((a) => a.category === "brand").length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("banner")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "banner"
                ? "bg-[#123f32] text-white"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            CMS Beranda & Banner ({allAssets.filter((a) => a.category === "banner").length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("curated_umkm")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "curated_umkm"
                ? "bg-[#123f32] text-white"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            Kurasi UMKM ({allAssets.filter((a) => a.category === "curated_umkm").length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("video")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              selectedCategory === "video"
                ? "bg-[#123f32] text-white"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            Media Video ({allAssets.filter((a) => a.category === "video").length})
          </button>

          {sessionUploads.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedCategory("upload")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                selectedCategory === "upload"
                  ? "bg-[#123f32] text-white"
                  : "border border-[#b7df68] bg-[#f2f9e6] text-[#123f32] hover:bg-[#b7df68]/40"
              }`}
            >
              Unggahan Sesi Ini ({sessionUploads.length})
            </button>
          ) : null}
        </div>
      </section>

      {/* 4. Main Media Showcase (Grid View or Table View) */}
      {filteredAssets.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8d8cf] bg-[#fbfaf6] p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#e7efe9] text-[#123f32]">
            <Search className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#123f32]">
            Tidak ada media yang cocok
          </h3>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#526059]">
            Tidak ditemukan berkas media untuk pencarian &quot;{searchQuery}&quot; pada kategori yang
            dipilih.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 rounded-xl border border-[#d8d8cf] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9]"
          >
            Reset Pencarian & Filter
          </button>
        </section>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredAssets.map((asset) => {
            const isVideo = asset.mimeType.startsWith("video/");
            const isCopied = copiedId === asset.id;
            const categoryInfo = CATEGORY_LABELS[asset.category];
            const hasFailed = failedImagePaths[asset.path];

            return (
              <div
                key={asset.id}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-xs transition-shadow hover:shadow-md"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => setSelectedAsset(asset)}
                  className="relative aspect-4/3 cursor-pointer overflow-hidden bg-[#f0ede4] border-b border-[#d8d8cf]"
                >
                  {isVideo ? (
                    <div className="relative flex size-full items-center justify-center bg-[#123f32] text-white">
                      <Video className="size-10 text-[#b7df68]" />
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-mono font-medium text-white">
                        MP4 Video
                      </span>
                    </div>
                  ) : hasFailed ? (
                    <div className="flex size-full items-center justify-center p-3 text-center text-xs text-[#526059]">
                      Pratinjau tidak tersedia
                    </div>
                  ) : (
                    <Image
                      src={asset.path}
                      alt={asset.name}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() =>
                        setFailedImagePaths((prev) => ({ ...prev, [asset.path]: true }))
                      }
                    />
                  )}

                  {/* Category Pill Tag */}
                  <div className="absolute left-2.5 top-2.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs ${categoryInfo.tone}`}
                    >
                      {categoryInfo.label}
                    </span>
                  </div>

                  {/* File Size Badge */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="inline-flex rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-mono font-medium text-white">
                      {formatBytes(asset.sizeBytes)}
                    </span>
                  </div>
                </div>

                {/* Card Content Info */}
                <div className="flex flex-1 flex-col p-3.5">
                  <h4
                    onClick={() => setSelectedAsset(asset)}
                    className="cursor-pointer text-xs font-bold text-[#123f32] line-clamp-1 hover:underline"
                    title={asset.name}
                  >
                    {asset.name}
                  </h4>
                  <p className="mt-1 font-mono text-[11px] text-[#526059] truncate" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#526059] line-clamp-2">
                    {asset.description}
                  </p>

                  {/* Actions Bar */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#e7efe9] pt-3">
                    <button
                      id={`admin-media-copy-${asset.id}`}
                      type="button"
                      onClick={() => handleCopyUrl(asset)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        isCopied
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-[#d8d8cf] bg-white text-[#123f32] hover:bg-[#e7efe9]"
                      }`}
                    >
                      {isCopied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      <span>{isCopied ? "Tersalin!" : "Salin URL"}</span>
                    </button>

                    <button
                      id={`admin-media-detail-${asset.id}`}
                      type="button"
                      onClick={() => setSelectedAsset(asset)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#e7efe9] px-2.5 py-1 text-[11px] font-semibold text-[#123f32] transition-colors hover:bg-[#123f32] hover:text-white"
                    >
                      <span>Detail</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* TABLE VIEW */
        <section className="overflow-hidden rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-xs">
          <Table>
            <TableHeader className="bg-[#f5f2e9]/80">
              <TableRow className="border-b border-[#d8d8cf] hover:bg-transparent">
                <TableHead className="w-16 text-center text-xs font-bold text-[#123f32]">
                  Pratinjau
                </TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">
                  Nama & Berkas
                </TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">
                  Kategori
                </TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">
                  Tipe File
                </TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">
                  Ukuran
                </TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">
                  Lokasi / Path
                </TableHead>
                <TableHead className="w-32 text-right text-xs font-bold text-[#123f32]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const isVideo = asset.mimeType.startsWith("video/");
                const isCopied = copiedId === asset.id;
                const categoryInfo = CATEGORY_LABELS[asset.category];

                return (
                  <TableRow
                    key={asset.id}
                    className="border-b border-[#d8d8cf]/70 hover:bg-[#e7efe9]/40 transition-colors"
                  >
                    {/* Thumbnail Column */}
                    <TableCell className="p-2 text-center">
                      <div
                        onClick={() => setSelectedAsset(asset)}
                        className="relative mx-auto size-11 cursor-pointer overflow-hidden rounded-lg border border-[#d8d8cf] bg-[#f0ede4]"
                      >
                        {isVideo ? (
                          <div className="flex size-full items-center justify-center bg-[#123f32] text-[#b7df68]">
                            <Video className="size-5" />
                          </div>
                        ) : (
                          <Image
                            src={asset.path}
                            alt={asset.name}
                            fill
                            unoptimized
                            sizes="44px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    </TableCell>

                    {/* Name & Filename */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className="text-left font-bold text-[#123f32] text-xs hover:underline block"
                      >
                        {asset.name}
                      </button>
                      <span className="font-mono text-[10px] text-[#526059] block">
                        {asset.filename}
                      </span>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge className={`text-[10px] font-semibold border-none ${categoryInfo.tone}`}>
                        {categoryInfo.label}
                      </Badge>
                    </TableCell>

                    {/* MIME Type */}
                    <TableCell className="font-mono text-[11px] text-[#526059]">
                      {asset.mimeType}
                    </TableCell>

                    {/* Size */}
                    <TableCell className="font-mono text-xs text-[#123f32] font-medium">
                      {formatBytes(asset.sizeBytes)}
                    </TableCell>

                    {/* Path */}
                    <TableCell className="max-w-[200px]">
                      <span className="font-mono text-[11px] text-[#526059] truncate block" title={asset.path}>
                        {asset.path}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(asset)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
                            isCopied
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                              : "border-[#d8d8cf] bg-white text-[#123f32] hover:bg-[#e7efe9]"
                          }`}
                          title="Salin URL"
                        >
                          {isCopied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAsset(asset)}
                          className="rounded-lg bg-[#e7efe9] px-2.5 py-1 text-[11px] font-semibold text-[#123f32] hover:bg-[#123f32] hover:text-white transition-colors"
                        >
                          Detail
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      )}

      {/* 5. Detail Inspection Drawer (Radix Sheet) */}
      <Sheet open={Boolean(selectedAsset)} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-[#fbfaf6] border-l border-[#d8d8cf] p-6">
          {selectedAsset ? (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs font-semibold border-none ${CATEGORY_LABELS[selectedAsset.category].tone}`}>
                    {CATEGORY_LABELS[selectedAsset.category].label}
                  </Badge>
                  <span className="text-xs font-mono text-[#526059]">
                    {selectedAsset.isStaticRepo ? "Repositori Statis (public/)" : "Backend Disk (uploads/)"}
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold text-[#123f32] pt-2">
                  {selectedAsset.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-[#526059]">
                  {selectedAsset.description}
                </SheetDescription>
              </SheetHeader>

              {/* Media Full Preview */}
              <div className="overflow-hidden rounded-xl border border-[#d8d8cf] bg-[#f0ede4]">
                {selectedAsset.mimeType.startsWith("video/") ? (
                  <video
                    src={selectedAsset.path}
                    controls
                    className="w-full max-h-72 bg-black object-contain"
                  />
                ) : (
                  <div className="relative aspect-16/10 w-full">
                    <Image
                      src={selectedAsset.path}
                      alt={selectedAsset.name}
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="space-y-3 rounded-xl border border-[#d8d8cf] bg-white p-4 text-xs">
                <h4 className="font-bold text-[#123f32] flex items-center gap-1.5">
                  <Info className="size-3.5 text-[#123f32]" />
                  <span>Spesifikasi Berkas</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e7efe9]">
                  <div>
                    <span className="text-[11px] text-[#526059]">Nama Berkas:</span>
                    <p className="font-mono font-medium text-[#123f32] break-all">{selectedAsset.filename}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#526059]">Ukuran Fisik:</span>
                    <p className="font-mono font-medium text-[#123f32]">
                      {formatBytes(selectedAsset.sizeBytes)} ({selectedAsset.sizeBytes.toLocaleString("id-ID")} byte)
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#526059]">Format / MIME:</span>
                    <p className="font-mono font-medium text-[#123f32]">{selectedAsset.mimeType}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#526059]">Tipe Penyimpanan:</span>
                    <p className="font-medium text-[#123f32]">
                      {selectedAsset.isStaticRepo ? "Public Assets" : "Backend Storage"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e7efe9]">
                  <span className="text-[11px] text-[#526059]">URL / Path Publik:</span>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] p-2">
                    <code className="flex-1 font-mono text-[11px] text-[#123f32] break-all">
                      {selectedAsset.path}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(selectedAsset)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#123f32] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0b3027]"
                    >
                      {copiedId === selectedAsset.id ? <Check className="size-3" /> : <Copy className="size-3" />}
                      <span>{copiedId === selectedAsset.id ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e7efe9]">
                  <span className="text-[11px] text-[#526059]">Rekomendasi Pemakaian di CMS:</span>
                  <p className="mt-1 text-[#123f32] font-medium leading-relaxed">
                    {selectedAsset.usageLocation}
                  </p>
                </div>
              </div>

              {/* Policy & Safety Notice */}
              <div className="rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] p-4 text-xs text-[#526059] space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#123f32]">
                  <ShieldCheck className="size-4 text-[#123f32]" />
                  <span>Kebijakan Keamanan Berkas LUMORA</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {selectedAsset.isStaticRepo
                    ? "Berkas ini merupakan aset inti repositori platform LUMORA. Berkas dilindungi dari penghapusan demi menjaga integritas antarmuka website."
                    : "Berkas ini diunggah ke backend storage. Penghapusan file server secara sepihak tidak diizinkan tanpa verifikasi referensi profil UMKM untuk mencegah broken image."}
                </p>
              </div>

              {/* External open action */}
              <div className="flex gap-2 pt-2">
                <a
                  href={selectedAsset.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8d8cf] bg-white px-4 py-2.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Buka Berkas di Tab Baru</span>
                </a>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
