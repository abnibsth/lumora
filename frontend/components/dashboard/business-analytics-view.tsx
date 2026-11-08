"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Compass,
  Bookmark,
  Handshake,
  MousePointerClick,
  Store,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
  ArrowRight,
  Target,
  Share2,
  Search,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchBusinessAnalytics } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { BusinessAnalytics } from "@/types/analytics";
import type { OwnedBusiness } from "@/types/business";

export function BusinessAnalyticsView({
  business,
  businesses = [],
  onSelectBusiness,
  onNavigateToProfiles,
}: {
  business: OwnedBusiness | null;
  businesses?: OwnedBusiness[];
  onSelectBusiness: (id: string) => void;
  onNavigateToProfiles: () => void;
}) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!business?.id) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetchBusinessAnalytics(business.id, range).then((res) => {
      if (!active) return;
      setLoading(false);
      if (res.ok && res.data) {
        setAnalytics(res.data);
      } else {
        setError(res.error || "Gagal memuat analitik bisnis.");
      }
    });

    return () => {
      active = false;
    };
  }, [business?.id, range]);

  const summary = analytics?.summary;
  const timeSeries = useMemo(() => analytics?.timeSeries || [], [analytics]);
  const funnel = useMemo(() => analytics?.funnel || [], [analytics]);
  const sources = useMemo(() => analytics?.trafficSource || [], [analytics]);

  // Chart Dimensions — Single-series focused SaaS aesthetic
  const chartHeight = 175;
  const chartWidth = 760;
  const paddingX = 20;
  const paddingY = 22;

  const maxViews = useMemo(() => {
    const highest = Math.max(...timeSeries.map((p) => p.views), 5);
    return Math.ceil(highest * 1.15);
  }, [timeSeries]);

  const viewPts = useMemo(() => {
    if (timeSeries.length === 0) return [];
    const usableW = chartWidth - paddingX * 2;
    const usableH = chartHeight - paddingY * 2;

    return timeSeries.map((p, idx) => {
      const x = paddingX + (idx / Math.max(timeSeries.length - 1, 1)) * usableW;
      const y = chartHeight - paddingY - (p.views / maxViews) * usableH;
      return { x, y, ...p };
    });
  }, [timeSeries, maxViews]);

  function makeSmoothCurve(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  const viewsCurve = useMemo(() => makeSmoothCurve(viewPts), [viewPts]);

  const viewsArea = useMemo(() => {
    if (viewPts.length === 0) return "";
    const last = viewPts[viewPts.length - 1];
    const first = viewPts[0];
    return `${viewsCurve} L ${last.x} ${chartHeight - paddingY} L ${first.x} ${chartHeight - paddingY} Z`;
  }, [viewPts, viewsCurve]);

  if (!business) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 sm:p-14 text-center border-line/50 bg-surface shadow-2xs rounded-2xl">
        <div className="flex size-12 items-center justify-center rounded-xl bg-soft-green text-forest">
          <Store className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold text-forest">Belum Ada Profil Bisnis</h2>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted">
          Buat profil bisnis UMKM Anda terlebih dahulu untuk mulai memanfaatkan analitik kunjungan dan peluang kemitraan.
        </p>
        <Button onClick={onNavigateToProfiles} className="mt-5 min-h-10 bg-forest px-4 text-xs font-semibold text-white hover:bg-deep-forest">
          Buat Profil Bisnis
        </Button>
      </Card>
    );
  }

  const isPublished = business.status === "published";

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. CLEAN SAAS HEADER */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/40 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-forest/70 mb-1">
            <Sparkles className="size-3.5 text-accent" />
            <span>Performa Profil Publik</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-forest">
            Analitik Profil
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Ringkasan jangkauan dan minat kemitraan untuk <strong className="text-forest font-semibold">{business.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Business Switcher (If Multiple) */}
          {businesses.length > 1 && (
            <select
              aria-label="Pilih bisnis untuk analitik"
              value={business.id}
              onChange={(e) => onSelectBusiness(e.target.value)}
              className="min-h-9 rounded-lg border border-line/60 bg-surface px-3 py-1 text-xs font-medium text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer shadow-2xs"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.status === "published" ? "Terbit" : "Draft"})
                </option>
              ))}
            </select>
          )}

          {/* Time Range Pills */}
          <div className="inline-flex rounded-lg border border-line/50 bg-surface p-0.5 shadow-2xs">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  range === r
                    ? "bg-forest text-lime shadow-2xs font-semibold"
                    : "text-muted hover:text-forest"
                }`}
              >
                {r === "7d" ? "7 Hari" : r === "30d" ? "30 Hari" : "90 Hari"}
              </button>
            ))}
          </div>

          {/* View Public Profile Link */}
          {isPublished && (
            <Link
              href={ROUTES.business(business.slug)}
              target="_blank"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line/50 bg-surface px-3 py-1 text-xs font-medium text-forest hover:bg-soft-green transition-colors shadow-2xs"
            >
              <span>Profil Publik</span>
              <ExternalLink className="size-3 text-muted" />
            </Link>
          )}
        </div>
      </section>

      {/* 2. DRAFT NOTICE (COMPACT) */}
      {!isPublished && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-200/80 bg-amber-50/60 text-xs text-amber-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <Info className="size-4 shrink-0 text-amber-600" />
            <span className="truncate">
              Profil usaha masih berstatus <strong>Draft</strong>. Terbitkan profil ke katalog LUMORA agar kunjungan publik mulai tercatat.
            </span>
          </div>
          <Button
            size="sm"
            onClick={onNavigateToProfiles}
            className="shrink-0 h-8 px-3 text-xs bg-forest text-white hover:bg-deep-forest"
          >
            Terbitkan Profil
          </Button>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && !analytics && (
        <div className="flex flex-col items-center justify-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin text-forest" />
          <p className="mt-2.5 text-xs font-medium">Memuat data analitik...</p>
        </div>
      )}

      {error && !analytics && (
        <div className="p-4 text-center rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 3. REFINED KPI HIERARCHY */}
      {summary && (
        <section aria-label="Metrik Utama" className="space-y-3">
          {/* TIER 1: 4 PRIMARY METRIC CARDS */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Tayangan Katalog */}
            <div className="rounded-xl border border-line/50 bg-surface p-5 shadow-2xs transition-colors hover:border-forest/30">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Tayangan Katalog</span>
                <Compass className="size-4 text-forest/70" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-forest">
                {summary.catalogImpressions.toLocaleString("id-ID")}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                    summary.impressionsChange >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {summary.impressionsChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  <span>{summary.impressionsChange >= 0 ? "+" : ""}{summary.impressionsChange}%</span>
                </span>
                <span className="text-muted/70 text-[11px]">vs periode lalu</span>
              </div>
            </div>

            {/* 2. Kunjungan Profil */}
            <div className="rounded-xl border border-line/50 bg-surface p-5 shadow-2xs transition-colors hover:border-forest/30">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Kunjungan Profil</span>
                <Eye className="size-4 text-forest/70" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-forest">
                {summary.profileViews.toLocaleString("id-ID")}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                    summary.viewsChange >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {summary.viewsChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  <span>{summary.viewsChange >= 0 ? "+" : ""}{summary.viewsChange}%</span>
                </span>
                <span className="text-muted/70 text-[11px]">vs periode lalu</span>
              </div>
            </div>

            {/* 3. Disimpan Mitra */}
            <div className="rounded-xl border border-line/50 bg-surface p-5 shadow-2xs transition-colors hover:border-forest/30">
              <div className="flex items-center justify-between text-muted text-xs">
                <span>Disimpan Mitra</span>
                <Bookmark className="size-4 text-forest/70" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-forest">
                {summary.bookmarksCount.toLocaleString("id-ID")}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                    summary.bookmarksChange >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {summary.bookmarksChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  <span>{summary.bookmarksChange >= 0 ? "+" : ""}{summary.bookmarksChange}%</span>
                </span>
                <span className="text-muted/70 text-[11px]">vs periode lalu</span>
              </div>
            </div>

            {/* 4. Permintaan Kolaborasi */}
            <div className="rounded-xl border border-forest/30 bg-surface p-5 shadow-2xs transition-colors hover:border-forest/50">
              <div className="flex items-center justify-between text-forest text-xs font-semibold">
                <span>Permintaan Kolaborasi</span>
                <Handshake className="size-4 text-forest" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-forest">
                {summary.collabRequests.toLocaleString("id-ID")}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                    summary.collabChange >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {summary.collabChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  <span>{summary.collabChange >= 0 ? "+" : ""}{summary.collabChange}%</span>
                </span>
                <span className="text-muted/70 text-[11px]">proposal masuk</span>
              </div>
            </div>
          </div>

          {/* TIER 2: SECONDARY METRICS (COMPACT SUB-BAR STRIP) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line/40 bg-surface/70 px-4 py-2.5 text-xs text-muted">
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-forest/70" />
              <span>Pengunjung Unik:</span>
              <strong className="text-forest font-semibold">{summary.uniqueVisitors}</strong>
              <span className="text-[11px] text-emerald-700">({summary.visitorsChange >= 0 ? "+" : ""}{summary.visitorsChange}%)</span>
            </div>

            <span className="hidden sm:inline text-line">•</span>

            <div className="flex items-center gap-2">
              <MousePointerClick className="size-3.5 text-forest/70" />
              <span>Klik Aksi Kontak:</span>
              <strong className="text-forest font-semibold">{summary.contactClicks}</strong>
              <span className="text-[11px] text-emerald-700">({summary.contactChange >= 0 ? "+" : ""}{summary.contactChange}%)</span>
            </div>

            <span className="hidden sm:inline text-line">•</span>

            <div className="text-[11px] text-muted">
              Data teragregasi otomatis dari aktivitas publik
            </div>
          </div>
        </section>
      )}

      {/* 4. REFINED HERO CHART (SINGLE-SERIES KUNJUNGAN PROFIL) */}
      <section aria-label="Grafik Tren Kunjungan">
        <div className="rounded-2xl border border-line/50 bg-surface p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/40 pb-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold text-forest">
                Tren Kunjungan Harian
              </h2>
              <p className="text-xs text-muted">
                Pergerakan volume kunjungan profil pada rentang {range}.
              </p>
            </div>

            {/* Single-series Legend */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-2 rounded-full bg-forest" />
              <span className="font-medium text-forest">Kunjungan Profil</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="mt-5 relative">
            {hoveredIdx !== null && viewPts[hoveredIdx] && (
              <div
                className="absolute z-10 pointer-events-none rounded-lg border border-line bg-surface/95 px-2.5 py-1 text-[11px] shadow-sm backdrop-blur-xs transition-all -translate-x-1/2 -top-9"
                style={{
                  left: `${(viewPts[hoveredIdx].x / chartWidth) * 100}%`,
                }}
              >
                <span className="font-semibold text-forest mr-1.5">{viewPts[hoveredIdx].date}:</span>
                <span className="text-forest font-bold">{viewPts[hoveredIdx].views} kunjungan</span>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <div className="min-w-[560px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 sm:h-48 lg:h-52 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="viewsSoftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#123f32" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#123f32" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* 3 Subtle Horizontal Guide Lines */}
                  {[0, 0.5, 1].map((ratio, idx) => {
                    const y = paddingY + (chartHeight - paddingY * 2) * (1 - ratio);
                    const val = Math.round(maxViews * ratio);
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#e5e5dc"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 6}
                          y={y + 3}
                          textAnchor="end"
                          className="text-[9px] fill-muted/70 font-medium"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Fill */}
                  {viewsArea && <path d={viewsArea} fill="url(#viewsSoftGrad)" />}

                  {/* Views Curve (Single Forest Line) */}
                  {viewsCurve && (
                    <path
                      d={viewsCurve}
                      fill="none"
                      stroke="#123f32"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Minimalist Interactive Nodes */}
                  {viewPts.map((pt, i) => (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredIdx === i ? 4.5 : 3}
                        className={`transition-all cursor-pointer ${
                          hoveredIdx === i
                            ? "fill-forest stroke-lime stroke-2"
                            : "fill-forest stroke-surface stroke-1.5"
                        }`}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    </g>
                  ))}
                </svg>

                {/* Date Axis */}
                <div className="flex justify-between text-[10px] text-muted font-medium mt-2 px-2">
                  {viewPts.length > 0 && (
                    <>
                      <span>{viewPts[0].date}</span>
                      {viewPts.length > 3 && (
                        <span>{viewPts[Math.floor(viewPts.length / 2)].date}</span>
                      )}
                      <span>{viewPts[viewPts.length - 1].date}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SIDE-BY-SIDE: REFINED STEP FUNNEL & ACQUISITION CHANNELS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* REFINED STEP FUNNEL (CLEAN 1-ROW DESIGN) */}
        <div className="rounded-2xl border border-line/50 bg-surface p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line/40 pb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-forest flex items-center gap-1.5">
                  <Target className="size-4 text-accent" />
                  <span>Funnel Konversi Kemitraan</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Efektivitas konversi audiens dari tayangan hingga permintaan kolaborasi.
                </p>
              </div>
            </div>

            {/* Clean 1-Row Stepped List */}
            <div className="mt-4 space-y-3.5">
              {funnel.map((step, idx) => {
                const dropOff = idx > 0 ? (100 - step.conversion).toFixed(1) : null;
                return (
                  <div key={step.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted/70">
                          0{idx + 1}
                        </span>
                        <span className="font-semibold text-forest">{step.stage}</span>
                        {dropOff && (
                          <span className="text-[10px] text-muted/70">
                            (drop-off: {dropOff}%)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-bold text-forest">
                          {step.count.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[11px] font-medium text-forest/80 bg-soft-green px-1.5 py-0.5 rounded">
                          {step.conversion}%
                        </span>
                      </div>
                    </div>

                    {/* Thin progress bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/40">
                      <div
                        className="h-full rounded-full bg-forest transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(step.count > 0 ? 5 : 0, step.conversion))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-line/40 text-[11px] text-muted flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-accent shrink-0" />
            <span>Konversi tertinggi pada tahap <strong>Disimpan → Kolaborasi (33.3%)</strong>.</span>
          </div>
        </div>

        {/* POLISHED ACQUISITION CHANNELS */}
        <div className="rounded-2xl border border-line/50 bg-surface p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-line/40 pb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-forest flex items-center gap-1.5">
                  <Share2 className="size-4 text-accent" />
                  <span>Kanal Penemuan Usaha</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Distribusi sumber kunjungan yang mengarahkan mitra ke profil Anda.
                </p>
              </div>
            </div>

            {/* Horizontal Bars */}
            <div className="mt-4 space-y-3.5">
              {sources.map((src, idx) => {
                const IconComponent =
                  src.source === "explore" ? Compass :
                  src.source === "search" ? Search :
                  src.source === "matching" ? Sparkles : Share2;

                return (
                  <div key={src.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <IconComponent className="size-3.5 text-forest/65" />
                        <span className="font-medium text-forest">{src.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-forest">{src.count}</span>
                        <span className="text-[11px] text-muted">({src.percentage}%)</span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/40">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          idx === 0 ? "bg-forest" : idx === 1 ? "bg-accent" : "bg-lime border border-forest/20"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(src.count > 0 ? 4 : 0, src.percentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini-Summary Chips */}
          <div className="mt-5 pt-3 border-t border-line/40 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-soft-green px-2 py-0.5 text-forest font-medium">
              Top: Jelajahi UMKM (47.6%)
            </span>
            <span className="rounded-md bg-ivory border border-line/50 px-2 py-0.5 text-muted">
              Pencarian: 25.9%
            </span>
            <span className="rounded-md bg-ivory border border-line/50 px-2 py-0.5 text-muted">
              Smart Matching: 18.4%
            </span>
          </div>
        </div>
      </div>

      {/* 6. EDITORIAL INSIGHT SECTION (LIGHTWEIGHT & ACTIONABLE) */}
      <section aria-label="Catatan Kinerja & Rekomendasi">
        <div className="rounded-2xl border border-line/50 bg-surface p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-line/40 pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 text-accent" />
              <h3 className="font-display text-base font-semibold text-forest">
                Catatan Kinerja &amp; Rekomendasi
              </h3>
            </div>
            <span className="text-[11px] text-muted">Berbasis data aktivitas periode ini</span>
          </div>

          {/* 3 Flowing Editorial Insight Points */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs leading-relaxed text-muted">
            <div className="space-y-1">
              <strong className="text-forest block text-xs font-semibold">1. Dominasi Katalog UMKM</strong>
              <p>
                Katalog publik menyumbang hampir 50% impresi awal. Mempertahankan keakuratan wilayah dan kategori F&amp;B menjaga profil tetap muncul pada pencarian mitra.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-forest block text-xs font-semibold">2. Efektivitas Nilai BMC</strong>
              <p>
                Rasio 1 dari 3 mitra yang menyimpan profil berlanjut mengajukan kolaborasi (33.3%), membuktikan narasi model bisnis dinilai kredibel dan transparan.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-forest block text-xs font-semibold">3. Potensi Smart Matching</strong>
              <p>
                Memperbarui catatan perkembangan usaha (milestone) tahun berjalan membantu sistem mempertahankan skor kecocokan tinggi di atas 85%.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between text-xs">
            <span className="text-muted text-[11px]">Ingin memperbarui cerita atau target kemitraan?</span>
            <button
              type="button"
              onClick={onNavigateToProfiles}
              className="inline-flex items-center gap-1 font-semibold text-forest hover:underline cursor-pointer"
            >
              <span>Perbarui Profil Bisnis</span>
              <ArrowRight className="size-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
