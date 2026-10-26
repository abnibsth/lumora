"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Settings,
  Sparkles,
  Search,
  Share2,
  Globe,
  SlidersHorizontal,
  FileCode2,
  CheckCircle2,
  Info,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  FolderTree,
  Server,
  Lock,
  ArrowRight,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { primaryNav, footerColumns, legalNav } from "@/data/navigation";
import { getApiBaseUrl, type AdminOverview } from "@/lib/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SettingsTab = "branding" | "seo" | "navigation" | "infrastructure";

interface BrandAssetInfo {
  name: string;
  filename: string;
  path: string;
  purpose: string;
  dimensions: string;
  usageLocation: string;
  isLightBg?: boolean;
}

const BRAND_ASSETS: BrandAssetInfo[] = [
  {
    name: "Logo Navbar Ringkas",
    filename: "logo-nav.png",
    path: "/img/logo-nav.png",
    purpose: "Logo daun + kata LUMORA tanpa tagline untuk keterbacaan optimal di navbar.",
    dimensions: "1501 x 422 px (Rasio 3.56:1)",
    usageLocation: "Navbar publik, header umum, dan mobile navigation.",
  },
  {
    name: "Logo Putih (Knockout)",
    filename: "logo-light.png",
    path: "/img/logo-light.png",
    purpose: "Varian logo putih monokrom untuk kontras tinggi pada latar belakang gelap.",
    dimensions: "1501 x 422 px (Rasio 3.56:1)",
    usageLocation: "Footer website dan bagian bertema forest green.",
    isLightBg: true,
  },
  {
    name: "Simbol Ikon Daun",
    filename: "logo-symbol.png",
    path: "/img/logo-symbol.png",
    purpose: "Simbol tunggal daun LUMORA untuk ruang kompak.",
    dimensions: "301 x 422 px (Rasio 1:1.4)",
    usageLocation: "Workspace sidebar (mode ikon), favicon shortcut, & avatar fallback.",
  },
  {
    name: "Logo Lengkap dengan Tagline",
    filename: "logo-full.png",
    path: "/img/logo-full.png",
    purpose: "Logo lockup lengkap menyertakan tagline resmi 'BISNIS KECIL, PELUANG BESAR'.",
    dimensions: "Resolusi tinggi",
    usageLocation: "Dokumen resmi, presentasi, dan materi publikasi platform.",
  },
];

export default function WebsiteSettingsView({
  overview: _overview,
}: {
  overview?: AdminOverview;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const apiBaseUrl = typeof window !== "undefined" ? getApiBaseUrl() : "";
  const displayApiUrl = apiBaseUrl || "Same-origin proxy (Reverse Proxy Next.js)";

  async function handleCopy(text: string, label: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
      }
    } catch {
      setCopiedText(null);
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
                <Settings className="size-3.5" />
                <span>Pengaturan Website</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#123f32]/20 bg-[#e7efe9] px-2.5 py-0.5 text-xs font-medium text-[#123f32]">
                <FileCode2 className="size-3" />
                <span>Status: Konfigurasi Deklaratif (Read-Only)</span>
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
              Pusat Pengaturan Website & Konfigurasi Platform
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#526059]">
              Pantau parameter identitas brand platform, metadata SEO mesin pencari, struktur navigasi
              publik, dan integrasi server LUMORA. Modul ini menyajikan nilai konfigurasi aktual yang
              berlaku di lingkungan produksi.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Ringkasan Status Sistem (System Metric Cards) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Nama Platform */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Nama & Identitas</span>
            <span className="rounded-lg bg-[#e7efe9] p-2 text-[#123f32]">
              <Sparkles className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {SITE.name}
          </p>
          <p className="mt-1 text-[11px] text-[#526059] truncate" title={SITE.positioning}>
            {SITE.positioning}
          </p>
        </div>

        {/* Card 2: Status SEO & Metadata */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">SEO & Bahasa</span>
            <span className="rounded-lg bg-[#b7df68]/40 p-2 text-[#123f32]">
              <Globe className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            Bahasa: &quot;id&quot;
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Title Template: <code className="font-mono">%s | LUMORA</code>
          </p>
        </div>

        {/* Card 3: Aset Brand Terpasang */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Aset Brand Resmi</span>
            <span className="rounded-lg bg-[#e7efe9] p-2 text-[#123f32]">
              <ImageIcon className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            4 Varian Logo
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Navbar, Dark mode, Simbol, & Favicon
          </p>
        </div>

        {/* Card 4: Target Backend API */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Integrasi Backend</span>
            <span className="rounded-lg bg-[#123f32] p-2 text-white">
              <Server className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-sm font-bold tracking-tight text-[#123f32] truncate" title={displayApiUrl}>
            {apiBaseUrl ? "Cloud API Active" : "Local Next Proxy"}
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Reverse Proxy: <code className="font-mono">/api/*</code> & <code className="font-mono">/uploads/*</code>
          </p>
        </div>
      </section>

      {/* 3. Sub-Navigasi 4 Tab Konfigurasi */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#d8d8cf] pb-2">
          <button
            id="tab-btn-branding"
            type="button"
            onClick={() => setActiveTab("branding")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "branding"
                ? "bg-[#123f32] text-white shadow-xs"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>1. Identitas Brand & Visual</span>
          </button>

          <button
            id="tab-btn-seo"
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "seo"
                ? "bg-[#123f32] text-white shadow-xs"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            <Globe className="size-3.5" />
            <span>2. SEO, Metadata & Pratinjau</span>
          </button>

          <button
            id="tab-btn-navigation"
            type="button"
            onClick={() => setActiveTab("navigation")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "navigation"
                ? "bg-[#123f32] text-white shadow-xs"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            <FolderTree className="size-3.5" />
            <span>3. Navigasi & Footer</span>
          </button>

          <button
            id="tab-btn-infrastructure"
            type="button"
            onClick={() => setActiveTab("infrastructure")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === "infrastructure"
                ? "bg-[#123f32] text-white shadow-xs"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            <Server className="size-3.5" />
            <span>4. Infrastruktur Server & API</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: IDENTITAS BRAND & VISUAL */}
        {/* ============================================================== */}
        {activeTab === "branding" ? (
          <div className="space-y-6">
            {/* Core Brand Parameters */}
            <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7efe9] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#123f32]">
                    Parameter Identitas Utama Platform
                  </h3>
                  <p className="text-xs text-[#526059]">
                    Sumber kode: <code className="font-mono text-[11px]">frontend/lib/constants.ts</code>
                  </p>
                </div>
                <Badge className="border-none bg-[#123f32] text-white text-[10px] font-mono">
                  SITE constant
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4">
                  <span className="text-[11px] font-medium text-[#526059]">Nama Resmi Platform (SITE.name)</span>
                  <p className="mt-1 font-display text-lg font-bold text-[#123f32]">{SITE.name}</p>
                  <p className="mt-2 text-[10px] text-[#526059]">Digunakan pada navbar, footer, metadata title, dan copyright.</p>
                </div>

                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4">
                  <span className="text-[11px] font-medium text-[#526059]">Positioning / Tagline (SITE.positioning)</span>
                  <p className="mt-1 text-sm font-semibold text-[#123f32]">&quot;{SITE.positioning}&quot;</p>
                  <p className="mt-2 text-[10px] text-[#526059]">Tagline filosofis platform untuk pelaku UMKM lokal.</p>
                </div>

                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4">
                  <span className="text-[11px] font-medium text-[#526059]">Kategori Layanan (SITE.category)</span>
                  <p className="mt-1 text-sm font-semibold text-[#123f32]">{SITE.category}</p>
                  <p className="mt-2 text-[10px] text-[#526059]">Deskripsi kategori platform di footer dan kartu OpenGraph.</p>
                </div>
              </div>

              {/* Design System & Typography Tokens */}
              <div className="mt-4 rounded-xl border border-[#d8d8cf] bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#123f32] flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3.5 text-[#123f32]" />
                  <span>Sistem Tipografi & Token Warna Inti</span>
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="text-[11px] text-[#526059]">Font Display & Teks Utama:</span>
                    <p className="font-semibold text-[#123f32]">Google Poppins & Geist Sans</p>
                    <p className="text-[10px] text-[#526059]">Konfigurasi font di <code className="font-mono">frontend/app/layout.tsx</code></p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#526059]">Palet Warna Utama LUMORA:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                        <span className="size-3 rounded-full bg-[#123f32]" /> Forest Green (#123f32)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                        <span className="size-3 rounded-full bg-[#b7df68]" /> Accent Lime (#b7df68)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                        <span className="size-3 rounded-full bg-[#fbfaf6] border border-[#d8d8cf]" /> Ivory Surface
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Visual Assets Gallery */}
            <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#123f32]">
                  Daftar Aset Visual & Logo Platform
                </h3>
                <p className="text-xs text-[#526059]">
                  Berkas fisik terverifikasi di direktori <code className="font-mono text-[11px]">frontend/public/img/</code>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {BRAND_ASSETS.map((asset) => (
                  <div
                    key={asset.filename}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#d8d8cf] bg-white shadow-xs"
                  >
                    <div
                      className={`relative flex aspect-16/10 items-center justify-center p-4 border-b border-[#d8d8cf] ${
                        asset.isLightBg ? "bg-[#123f32]" : "bg-[#f5f2e9]"
                      }`}
                    >
                      <Image
                        src={asset.path}
                        alt={asset.name}
                        width={200}
                        height={60}
                        unoptimized
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>

                    <div className="p-3.5 space-y-2">
                      <h4 className="text-xs font-bold text-[#123f32]">{asset.name}</h4>
                      <p className="font-mono text-[10px] text-[#526059] truncate" title={asset.path}>
                        {asset.path}
                      </p>
                      <p className="text-[11px] text-[#526059] leading-relaxed line-clamp-2">
                        {asset.purpose}
                      </p>
                      <p className="text-[10px] text-[#123f32] font-medium pt-1 border-t border-[#e7efe9]">
                        Lokasi: {asset.usageLocation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* TAB 2: SEO, METADATA & PRATINJAU */}
        {/* ============================================================== */}
        {activeTab === "seo" ? (
          <div className="space-y-6">
            {/* Metadata Parameters Card */}
            <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7efe9] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#123f32]">
                    Parameter Metadata & SEO Root Layout
                  </h3>
                  <p className="text-xs text-[#526059]">
                    Sumber kode: <code className="font-mono text-[11px]">frontend/app/layout.tsx</code> (baris 16–34)
                  </p>
                </div>
                <Badge className="border-none bg-[#123f32] text-white text-[10px] font-mono">
                  Next.js Metadata API
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 space-y-1">
                  <span className="text-[11px] text-[#526059]">Default Meta Title:</span>
                  <p className="font-semibold text-[#123f32]">&quot;LUMORA | Cerita Bisnis, Peluang Nyata&quot;</p>
                </div>

                <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 space-y-1">
                  <span className="text-[11px] text-[#526059]">Title Template:</span>
                  <p className="font-mono font-semibold text-[#123f32]">&quot;%s | LUMORA&quot;</p>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-[#d8d8cf] bg-white p-3.5 space-y-1">
                  <span className="text-[11px] text-[#526059]">Meta Description:</span>
                  <p className="text-xs text-[#123f32] leading-relaxed">
                    &quot;Temukan UMKM Indonesia, pelajari perjalanan usahanya, dan mulai percakapan dengan pemilik bisnis melalui LUMORA.&quot;
                  </p>
                </div>

                <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 space-y-1">
                  <span className="text-[11px] text-[#526059]">Atribut Bahasa HTML (lang):</span>
                  <p className="font-mono font-semibold text-[#123f32]">&lt;html lang=&quot;id&quot;&gt;</p>
                </div>

                <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 space-y-1">
                  <span className="text-[11px] text-[#526059]">Favicon Target:</span>
                  <p className="font-mono text-xs text-[#123f32]">/img/logo.png (via /favicon.ico rewrite)</p>
                </div>
              </div>
            </div>

            {/* Interactive SEO Previews */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Google Search Snippet Simulation */}
              <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="size-4 text-[#123f32]" />
                    <h4 className="text-sm font-bold text-[#123f32]">
                      Pratinjau Hasil Pencarian Google
                    </h4>
                  </div>
                  <Badge variant="outline" className="border-[#d8d8cf] bg-white text-[10px] text-[#526059]">
                    Simulasi SERP
                  </Badge>
                </div>
                <p className="text-[11px] text-[#526059]">
                  Tampilan tautan website ketika muncul di hasil pencarian Google.
                </p>

                {/* Google SERP Box */}
                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 font-sans space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-[#123f32] p-1 flex items-center justify-center">
                      <Image
                        src="/img/logo-symbol.png"
                        alt=""
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <span className="font-medium text-[#202124] block">LUMORA</span>
                      <span className="text-[#5f6368] font-mono text-[10px]">https://lumora.id › beranda</span>
                    </div>
                  </div>

                  <h5 className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                    LUMORA | Cerita Bisnis, Peluang Nyata
                  </h5>

                  <p className="text-xs text-[#4d5156] leading-relaxed">
                    Temukan UMKM Indonesia, pelajari perjalanan usahanya, dan mulai percakapan dengan pemilik bisnis melalui LUMORA.
                  </p>
                </div>
              </div>

              {/* OpenGraph / Social Share Card Simulation */}
              <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="size-4 text-[#123f32]" />
                    <h4 className="text-sm font-bold text-[#123f32]">
                      Pratinjau Kartu Media Sosial (OpenGraph)
                    </h4>
                  </div>
                  <Badge variant="outline" className="border-[#d8d8cf] bg-white text-[10px] text-[#526059]">
                    Simulasi Kartu
                  </Badge>
                </div>
                <p className="text-[11px] text-[#526059]">
                  Tampilan tautan saat dibagikan melalui WhatsApp, Twitter/X, atau LinkedIn.
                </p>

                {/* OpenGraph Card Box */}
                <div className="overflow-hidden rounded-xl border border-[#d8d8cf] bg-white shadow-2xs">
                  <div className="relative aspect-16/9 w-full bg-[#123f32]">
                    <Image
                      src="/img/lumora-social-banner.png"
                      alt="Banner Sosial LUMORA"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] font-mono text-[#526059] uppercase">lumora.id</span>
                    <h5 className="text-xs font-bold text-[#123f32]">
                      LUMORA | Cerita Bisnis, Peluang Nyata
                    </h5>
                    <p className="text-[11px] text-[#526059] leading-snug line-clamp-2">
                      Digital Pitching + Business Discovery Platform untuk UMKM Indonesia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* TAB 3: NAVIGASI & FOOTER */}
        {/* ============================================================== */}
        {activeTab === "navigation" ? (
          <div className="space-y-6">
            {/* Primary Navigation Table */}
            <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7efe9] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#123f32]">
                    Daftar Menu Navigasi Header Publik
                  </h3>
                  <p className="text-xs text-[#526059]">
                    Sumber kode: <code className="font-mono text-[11px]">frontend/data/navigation.ts</code> (<code className="font-mono text-[10px]">primaryNav</code>)
                  </p>
                </div>
                <Badge className="border-none bg-[#123f32] text-white text-[10px]">
                  5 Menu Aktif
                </Badge>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#d8d8cf] bg-white">
                <Table>
                  <TableHeader className="bg-[#f5f2e9]/70">
                    <TableRow className="border-b border-[#d8d8cf]">
                      <TableHead className="w-12 text-center text-xs font-bold text-[#123f32]">No</TableHead>
                      <TableHead className="text-xs font-bold text-[#123f32]">Label Menu</TableHead>
                      <TableHead className="text-xs font-bold text-[#123f32]">Target URL (Rute)</TableHead>
                      <TableHead className="text-xs font-bold text-[#123f32]">Tipe Halaman</TableHead>
                      <TableHead className="text-right text-xs font-bold text-[#123f32]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {primaryNav.map((item, idx) => (
                      <TableRow key={item.href} className="border-b border-[#d8d8cf]/70 hover:bg-[#e7efe9]/40">
                        <TableCell className="text-center font-mono text-xs text-[#526059]">#{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-xs text-[#123f32]">{item.label}</TableCell>
                        <TableCell className="font-mono text-xs text-[#526059]">{item.href}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#d8d8cf] text-[10px] text-[#123f32]">
                            {item.href.startsWith("/#") ? "Anchor Landing Page" : "Halaman Rute Internal"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={item.href}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#123f32] hover:underline"
                          >
                            <span>Buka</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Footer Columns Structure */}
            <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#123f32]">
                  Struktur 4 Kolom Footer Website
                </h3>
                <p className="text-xs text-[#526059]">
                  Sumber kode: <code className="font-mono text-[11px]">frontend/data/navigation.ts</code> (<code className="font-mono text-[10px]">footerColumns</code>)
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {footerColumns.map((col) => (
                  <div key={col.title} className="rounded-xl border border-[#d8d8cf] bg-white p-4 space-y-2">
                    <h4 className="text-xs font-bold text-[#123f32] border-b border-[#e7efe9] pb-1.5">
                      {col.title}
                    </h4>
                    <ul className="space-y-1.5 pt-1">
                      {col.items.map((subItem) => (
                        <li key={subItem.label} className="text-[11px] text-[#526059] flex items-center justify-between">
                          <span>{subItem.label}</span>
                          <span className="font-mono text-[10px] text-[#66736d] truncate max-w-[100px]">{subItem.href}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Legal Links Note */}
              <div className="rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] p-4 text-xs text-[#526059] space-y-1.5">
                <span className="font-bold text-[#123f32] flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#123f32]" />
                  <span>Tautan Hukum & Kebijakan Platform (legalNav):</span>
                </span>
                <div className="flex flex-wrap gap-4 pt-1">
                  {legalNav.map((legal) => (
                    <span key={legal.href} className="inline-flex items-center gap-1 text-[11px] font-medium text-[#123f32]">
                      <ArrowRight className="size-3 text-[#123f32]" />
                      <span>{legal.label} ({legal.href})</span>
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-[#66736d] pt-2">
                  *Catatan PRD 10.14: Kolom media sosial dan alamat kontak sengaja ditiadakan sementara karena akun resmi media sosial LUMORA belum aktif.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* TAB 4: INFRASTRUKTUR SERVER & API */}
        {/* ============================================================== */}
        {activeTab === "infrastructure" ? (
          <div className="space-y-6">
            {/* Architecture Specifications */}
            <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7efe9] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#123f32]">
                    Spesifikasi Lingkungan & Integrasi Server
                  </h3>
                  <p className="text-xs text-[#526059]">
                    Informasi konfigurasi arsitektur runtime Next.js dan backend Go.
                  </p>
                </div>
                <Badge className="border-none bg-[#123f32] text-white text-[10px] font-mono">
                  Runtime Specs
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                {/* Target API URL */}
                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#123f32]">Target API Base URL:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(displayApiUrl, "api-url")}
                      className="inline-flex items-center gap-1 rounded-md border border-[#d8d8cf] bg-white px-2 py-0.5 text-[10px] text-[#123f32] hover:bg-[#e7efe9]"
                    >
                      {copiedText === "api-url" ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      <span>{copiedText === "api-url" ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>
                  <code className="font-mono text-xs text-[#123f32] break-all block p-2 rounded-lg bg-[#f5f2e9]">
                    {displayApiUrl}
                  </code>
                  <p className="text-[10px] text-[#526059]">
                    Ditentukan dari <code className="font-mono">INTERNAL_API_URL</code> atau <code className="font-mono">BACKEND_URL</code>.
                  </p>
                </div>

                {/* Upload & Media Limit */}
                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 space-y-2">
                  <span className="text-[11px] font-bold text-[#123f32]">Batas Ukuran Upload Media:</span>
                  <p className="text-sm font-bold text-[#123f32]">5 MB (5.242.880 byte)</p>
                  <p className="text-[11px] text-[#526059]">
                    Format didukung: <code className="font-mono text-[10px]">image/jpeg, png, webp, gif</code>.
                  </p>
                  <p className="text-[10px] text-[#526059]">
                    Divalidasi magic-bytes sniffing di Go handler (<code className="font-mono text-[10px]">media.go</code>).
                  </p>
                </div>

                {/* Reverse Proxy Mapping */}
                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 space-y-2">
                  <span className="text-[11px] font-bold text-[#123f32]">Next.js Reverse Proxy Rewrites:</span>
                  <ul className="font-mono text-[11px] text-[#526059] space-y-1">
                    <li>• <code className="text-[#123f32]">/api/:path*</code> → <code className="text-[#66736d]">${"{"}BACKEND_URL{"}"}/api/:path*</code></li>
                    <li>• <code className="text-[#123f32]">/uploads/:path*</code> → <code className="text-[#66736d]">${"{"}BACKEND_URL{"}"}/uploads/:path*</code></li>
                  </ul>
                  <p className="text-[10px] text-[#526059]">
                    Sumber konfigurasi: <code className="font-mono">frontend/next.config.ts</code>
                  </p>
                </div>

                {/* AI Engine */}
                <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 space-y-2">
                  <span className="text-[11px] font-bold text-[#123f32]">Layanan Kecerdasan Buatan (AI Engine):</span>
                  <p className="text-sm font-bold text-[#123f32]">Google Gemini 2.5 Flash</p>
                  <p className="text-[11px] text-[#526059]">
                    Diorkestrasi di sisi server Go melalui endpoint <code className="font-mono text-[10px]">/api/v1/ai/draft-profile</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Guarantee Notice */}
            <div className="rounded-2xl border border-[#d8d8cf] bg-[#f5f2e9] p-6 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="rounded-xl bg-[#123f32] p-2 text-white shrink-0 mt-0.5">
                  <Lock className="size-5 text-[#b7df68]" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-[#123f32]">
                    Jaminan Kepatuhan Keamanan Rahasia Server
                  </h4>
                  <p className="text-xs leading-relaxed text-[#526059]">
                    Sesuai standar keamanan platform LUMORA, seluruh kunci rahasia (*API keys* Gemini, Resend,
                    koneksi basis data PostgreSQL, dan token sesi enkripsi) diproteksi di sisi server backend dan tidak
                    pernah diekspos ke antarmuka klien atau response browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* 4. Panel Kesiapan Mutasi Dinamis & Roadmap API Backend */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#f5f2e9] p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-[#123f32] p-2 text-white shrink-0 mt-0.5">
            <Info className="size-5 text-[#b7df68]" />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#123f32]">
                Status Tata Kelola Konfigurasi Website & Batasan Penyimpanan
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#526059]">
                Pengaturan website umum (identitas brand, metadata SEO root, dan navigasi footer) saat ini
                bersumber dari konstanta TypeScript dan Next.js Metadata API. Backend Go belum menyediakan tabel basis data{" "}
                <code className="font-mono text-[11px]">website_settings</code> maupun rute mutasi{" "}
                <code className="font-mono text-[11px]">PATCH /api/v1/admin/settings</code>.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[#d8d8cf]">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#123f32] flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-700" />
                  <span>Ketiadaan Tombol Simpan Palsu</span>
                </span>
                <p className="text-[11px] leading-relaxed text-[#526059]">
                  Sesuai prinsip integritas produk LUMORA (*No-Fake-CRUD*), modul ini tidak menyediakan tombol simpan
                  yang seolah-olah menulis ke database. Perubahan konfigurasi global sementara dilakukan melalui pembaruan kode sumber.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-[#123f32] flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-[#123f32]" />
                  <span>Perbedaan dengan CMS Manajemen Beranda</span>
                </span>
                <p className="text-[11px] leading-relaxed text-[#526059]">
                  Konten dinamis 8 section beranda dikelola tersendiri melalui tab <strong>Manajemen Beranda</strong> yang
                  telah memiliki penyimpanan state terverifikasi (<code className="font-mono text-[10px]">data/homepage-store.json</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
