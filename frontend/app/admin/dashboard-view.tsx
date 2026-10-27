"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  Store,
  Handshake,
  Building2,
  Globe,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowRight,
  X,
  Calendar,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import type { AdminOverview } from "@/lib/api";
import { useAdminNav } from "./admin-shell";

interface DashboardViewProps {
  overview: AdminOverview;
}

// Format number in Indonesian locale
function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

// Format date in Indonesian locale (e.g. 24 Okt 2026)
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "-";
  }
}

// Generate complete 6-month continuous window ending at current month
function getSixMonthWindow(rawGrowth: Array<{ month: string; count: number }>) {
  const result: Array<{
    key: string;
    monthLabel: string;
    fullMonthName: string;
    count: number;
    year: number;
  }> = [];

  const now = new Date();

  // Map raw data by "YYYY-MM"
  const lookup = new Map<string, number>();
  for (const item of rawGrowth) {
    try {
      const d = new Date(item.month);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        lookup.set(key, item.count);
      }
    } catch {
      // ignore invalid date
    }
  }

  // Iterate backwards from 5 months ago to current month
  for (let i = 5; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = new Intl.DateTimeFormat("id-ID", {
      month: "short",
      year: "2-digit",
    }).format(target);
    const fullMonthName = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(target);
    const count = lookup.get(key) ?? 0;

    result.push({
      key,
      monthLabel,
      fullMonthName,
      count,
      year: target.getFullYear(),
    });
  }

  return result;
}

export default function DashboardView({ overview }: DashboardViewProps) {
  const { metrics, registrationGrowth, recentBusinesses } = overview;
  const { navigateToTab } = useAdminNav();

  const [showAllModal, setShowAllModal] = useState(false);
  const chartId = useId();

  // Normalized 6-month growth data
  const sixMonths = getSixMonthWindow(registrationGrowth);
  const maxCount = Math.max(...sixMonths.map((p) => p.count), 0);
  const totalGrowthNewProfiles = sixMonths.reduce((acc, curr) => acc + curr.count, 0);

  // Highest month calculation for truthful metrics summary
  const peakMonth = sixMonths.reduce(
    (peak, curr) => (curr.count > peak.count ? curr : peak),
    sixMonths[0]
  );
  const avgMonthly = (totalGrowthNewProfiles / 6).toFixed(1).replace(".", ",");

  // Track selected/hovered month (default to peak month if exists, or last month)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    peakMonth.count > 0 ? peakMonth.key : sixMonths[sixMonths.length - 1].key
  );
  const activeMonthPoint =
    sixMonths.find((p) => p.key === selectedMonthKey) ?? sixMonths[sixMonths.length - 1];

  // SVG Chart Dimensions
  const chartHeight = 175;
  const chartWidth = 440;
  const paddingX = 42;
  const paddingTop = 24;
  const paddingBottom = 30;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableWidth = chartWidth - paddingX * 2;
  const colWidth = usableWidth / sixMonths.length;
  const barWidth = Math.min(28, colWidth * 0.55);

  // 5 latest profiles for main dashboard
  const displayedProfiles = recentBusinesses.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123f32]">
          Dashboard Administrator
        </h1>
        <p className="mt-1 text-sm text-[#4a5550]">
          Ikhtisar operasional dan data terkini CMS LUMORA berbasis data produksi.
        </p>
      </div>

      {/* 1. Four KPI Cards */}
      <section aria-label="Indikator Kinerja Utama" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Pengguna UMKM */}
        <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs transition-colors hover:border-[#123f32]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374741]">
              Pengguna UMKM
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e7efe9] text-[#123f32]">
              <Store className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#123f32] tabular-nums">
              {formatNumber(metrics.totalUmkmUsers)}
            </div>
            <p className="mt-1.5 text-xs text-[#4a5550] leading-relaxed">
              Akun pelaku usaha terdaftar di platform
            </p>
          </div>
        </div>

        {/* KPI 2: Pengguna Mitra */}
        <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs transition-colors hover:border-[#123f32]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374741]">
              Pengguna Mitra
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e7efe9] text-[#123f32]">
              <Handshake className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#123f32] tabular-nums">
              {formatNumber(metrics.totalMitraUsers)}
            </div>
            <p className="mt-1.5 text-xs text-[#4a5550] leading-relaxed">
              Mitra kolaborasi & peluang bisnis
            </p>
          </div>
        </div>

        {/* KPI 3: Profil Terdaftar */}
        <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs transition-colors hover:border-[#123f32]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374741]">
              Total Profil Bisnis
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e7efe9] text-[#123f32]">
              <Building2 className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#123f32] tabular-nums">
              {formatNumber(metrics.totalBusinesses)}
            </div>
            <p className="mt-1.5 text-xs text-[#4a5550] leading-relaxed">
              Profil aktif (draft maupun published)
            </p>
          </div>
        </div>

        {/* KPI 4: Profil Published */}
        <div className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs transition-colors hover:border-[#123f32]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#374741]">
              Profil Published
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#e7efe9] text-[#123f32]">
              <Globe className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tracking-tight text-[#123f32] tabular-nums">
              {formatNumber(metrics.publishedBusinesses)}
            </div>
            <p className="mt-1.5 text-xs text-[#4a5550] leading-relaxed">
              Dapat diakses publik di website LUMORA
            </p>
          </div>
        </div>
      </section>

      {/* 2. Section "Perlu Perhatian" */}
      <section
        aria-label="Item Perlu Perhatian"
        className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#d8d8cf] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#e7efe9] text-[#123f32]">
              <AlertCircle className="size-4.5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#123f32]">
                Perlu Perhatian
              </h2>
              <p className="text-xs text-[#4a5550]">
                Status operasional antrean verifikasi dan ketersediaan sistem kurasi
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#4a5550]">
            Status Sistem
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Item 1: Antrean Verifikasi Profil Published (REAL METRIC) */}
          <div className="rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] p-4 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#14382f]">
                  Antrean Verifikasi Profil
                </span>
                {metrics.unverifiedPublishedBusinesses > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-300 whitespace-nowrap">
                    <ShieldAlert className="size-3 shrink-0" />
                    <span>{metrics.unverifiedPublishedBusinesses} Menunggu</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e7efe9] px-2.5 py-0.5 text-[11px] font-semibold text-[#123f32] border border-[#b7df68]/50 whitespace-nowrap">
                    <ShieldCheck className="size-3 shrink-0" />
                    <span>0 Antrean</span>
                  </span>
                )}
              </div>

              <div className="mt-2 text-3xl font-bold text-[#123f32] tabular-nums">
                {metrics.unverifiedPublishedBusinesses}
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-[#4a5550]">
                {metrics.unverifiedPublishedBusinesses > 0
                  ? "Profil published yang belum memiliki tanda centang verifikasi admin LUMORA."
                  : "Semua profil berstatus published saat ini telah terverifikasi admin."}
              </p>
            </div>

            {/* Action Tinjau Profil to Manajemen UMKM with unverified filter */}
            {metrics.unverifiedPublishedBusinesses > 0 && (
              <div className="pt-3 mt-2 border-t border-[#d8d8cf]/60">
                <button
                  type="button"
                  id="admin-btn-review-unverified"
                  onClick={() => navigateToTab(2, "unverified")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#123f32] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0b3027] transition-colors"
                >
                  <span>Tinjau Profil</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Item 2: Peluang Kerja Sama (UNINTEGRATED MODULE) */}
          <div className="rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#14382f]">
                  Peluang Kerja Sama
                </span>
                <span className="inline-flex items-center rounded-full bg-[#f0ece1] border border-[#d8d8cf] px-2.5 py-0.5 text-[11px] font-medium text-[#526059]">
                  Belum Diintegrasikan
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-[#66736d] tabular-nums">
                —
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#526059]">
                Pipa pengajuan kemitraan dan peluang kolaborasi belum terhubung ke sistem monitoring backend.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-[#d8d8cf]/60 text-[11px] text-[#526059] flex items-center gap-1">
              <Info className="size-3 shrink-0" />
              <span>Menunggu integrasi modul Peluang & Mitra</span>
            </div>
          </div>

          {/* Item 3: Moderasi Konten (UNINTEGRATED MODULE) */}
          <div className="rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#14382f]">
                  Moderasi Konten
                </span>
                <span className="inline-flex items-center rounded-full bg-[#f0ece1] border border-[#d8d8cf] px-2.5 py-0.5 text-[11px] font-medium text-[#526059]">
                  Belum Diintegrasikan
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-[#66736d] tabular-nums">
                —
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#526059]">
                Sistem pelaporan pelanggaran konten dan antrean kurasi postingan belum aktif di platform.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-[#d8d8cf]/60 text-[11px] text-[#526059] flex items-center gap-1">
              <Info className="size-3 shrink-0" />
              <span>Sistem monitoring aktif belum tersedia</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Middle Row: Pertumbuhan Profil Bulanan & Profil Terbaru */}
      <div className="grid gap-6 xl:grid-cols-12 items-start">
        {/* Left Column: Bar Chart Pertumbuhan Profil (5 columns on desktop) */}
        <section
          aria-label="Pertumbuhan Profil Baru Bulanan"
          className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs xl:col-span-5 space-y-4"
        >
          {/* Chart Header */}
          <div className="flex items-center justify-between border-b border-[#d8d8cf] pb-3.5">
            <div>
              <h2 className="text-base font-bold text-[#123f32]">
                Pendaftaran Profil Bulanan
              </h2>
              <p className="text-xs text-[#4a5550]">
                Profil UMKM baru yang dibuat dalam 6 bulan terakhir
              </p>
            </div>
            <span className="rounded-lg border border-[#d8d8cf] bg-[#f5f2e9] px-2.5 py-1 text-xs font-semibold text-[#123f32]">
              6 Bulan
            </span>
          </div>

          {/* Balanced Stats Bar */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] p-3 text-center">
            <div>
              <span className="block text-[11px] font-medium text-[#526059]">
                Total Pendaftar
              </span>
              <span className="text-lg font-bold text-[#123f32] tabular-nums">
                {totalGrowthNewProfiles}
              </span>
            </div>
            <div className="border-x border-[#d8d8cf]">
              <span className="block text-[11px] font-medium text-[#526059]">
                Rata-Rata/Bln
              </span>
              <span className="text-lg font-bold text-[#123f32] tabular-nums">
                {avgMonthly}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#526059]">
                Bulan Puncak
              </span>
              <span className="text-lg font-bold text-[#123f32] tabular-nums">
                {peakMonth.count > 0 ? `${peakMonth.monthLabel} (${peakMonth.count})` : "—"}
              </span>
            </div>
          </div>

          {/* Interactive Inspection Tooltip Banner */}
          <div className="rounded-lg border border-[#d8d8cf] bg-[#e7efe9]/60 px-3 py-2 text-xs text-[#14382f] flex items-center justify-between">
            <span className="font-semibold text-[#123f32]">
              {activeMonthPoint.fullMonthName}:
            </span>
            <span className="tabular-nums font-bold text-[#123f32]">
              {activeMonthPoint.count} profil baru didaftarkan
            </span>
          </div>

          {/* Chart Display */}
          <div>
            {maxCount === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d8cf] bg-[#f5f2e9] p-6 text-center">
                <Calendar className="size-8 text-[#526059]" />
                <p className="mt-2 text-sm font-semibold text-[#14382f]">
                  Belum Ada Data Pendaftaran
                </p>
                <p className="mt-1 text-xs text-[#526059]">
                  Tidak ada catatan profil baru dalam 6 bulan terakhir.
                </p>
              </div>
            ) : (
              <div className="w-full">
                {/* Responsive SVG Chart */}
                <svg
                  role="img"
                  aria-labelledby={chartId}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto overflow-visible select-none"
                >
                  <title id={chartId}>
                    Grafik pendaftaran profil UMKM baru dalam 6 bulan terakhir
                  </title>

                  {/* Horizontal Guide Lines */}
                  {/* Top Line (Max) */}
                  <line
                    x1={paddingX}
                    y1={paddingTop}
                    x2={chartWidth - paddingX}
                    y2={paddingTop}
                    stroke="#d8d8cf"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={paddingTop + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#526059"
                    fontWeight="500"
                    className="font-mono"
                  >
                    {maxCount}
                  </text>

                  {/* Mid Line (Max / 2) */}
                  {maxCount > 1 && (
                    <>
                      <line
                        x1={paddingX}
                        y1={paddingTop + usableHeight / 2}
                        x2={chartWidth - paddingX}
                        y2={paddingTop + usableHeight / 2}
                        stroke="#d8d8cf"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 8}
                        y={paddingTop + usableHeight / 2 + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#526059"
                        fontWeight="500"
                        className="font-mono"
                      >
                        {Math.round(maxCount / 2)}
                      </text>
                    </>
                  )}

                  {/* Baseline (0) */}
                  <line
                    x1={paddingX}
                    y1={paddingTop + usableHeight}
                    x2={chartWidth - paddingX}
                    y2={paddingTop + usableHeight}
                    stroke="#d8d8cf"
                    strokeWidth="1.5"
                  />
                  <text
                    x={paddingX - 8}
                    y={paddingTop + usableHeight + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#526059"
                    fontWeight="500"
                    className="font-mono"
                  >
                    0
                  </text>

                  {/* Bars & Labels */}
                  {sixMonths.map((item, index) => {
                    const colCenter = paddingX + index * colWidth + colWidth / 2;
                    const barX = colCenter - barWidth / 2;
                    const heightRatio = maxCount > 0 ? item.count / maxCount : 0;
                    const barH = heightRatio * usableHeight;
                    const barY = paddingTop + usableHeight - barH;
                    const isSelected = selectedMonthKey === item.key;

                    return (
                      <g
                        key={item.key}
                        tabIndex={0}
                        aria-label={`${item.monthLabel}: ${item.count} profil baru`}
                        onMouseEnter={() => setSelectedMonthKey(item.key)}
                        onClick={() => setSelectedMonthKey(item.key)}
                        onFocus={() => setSelectedMonthKey(item.key)}
                        className="cursor-pointer outline-none group"
                      >
                        {/* Hover/selected column background highlight */}
                        <rect
                          x={colCenter - colWidth / 2 + 2}
                          y={paddingTop - 4}
                          width={colWidth - 4}
                          height={usableHeight + 8}
                          fill={isSelected ? "#e7efe9" : "transparent"}
                          rx="6"
                          className="transition-colors duration-150"
                        />

                        {/* Bar */}
                        {item.count > 0 && (
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={Math.max(2, barH)}
                            rx="4"
                            ry="4"
                            fill={isSelected ? "#0b3027" : "#123f32"}
                            className="transition-all duration-200"
                          />
                        )}

                        {/* Value Label above bar */}
                        <text
                          x={colCenter}
                          y={item.count > 0 ? barY - 6 : paddingTop + usableHeight - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={item.count > 0 ? "700" : "500"}
                          fill={item.count > 0 ? "#123f32" : "#94a3b8"}
                        >
                          {item.count}
                        </text>

                        {/* Month Label below baseline */}
                        <text
                          x={colCenter}
                          y={paddingTop + usableHeight + 17}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight={isSelected ? "700" : "500"}
                          fill={isSelected ? "#123f32" : "#4a5550"}
                        >
                          {item.monthLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Accessible text summary for screen readers */}
                <div className="sr-only">
                  <table>
                    <caption>Tabel ringkasan pendaftaran bulanan</caption>
                    <thead>
                      <tr>
                        <th>Bulan</th>
                        <th>Jumlah Profil Baru</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sixMonths.map((m) => (
                        <tr key={m.key}>
                          <td>{m.monthLabel}</td>
                          <td>{m.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-[#526059] border-t border-[#d8d8cf] pt-2.5">
              <span>Satuan: Jumlah profil bisnis dibuat</span>
              <span>Sumber: Tabel bisnis PostgreSQL</span>
            </div>
          </div>
        </section>

        {/* Right Column: Profil Terbaru (7 columns on desktop) */}
        <section
          aria-label="Profil Terbaru"
          className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs xl:col-span-7 space-y-4"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#d8d8cf] pb-3.5">
            <div>
              <h2 className="text-base font-bold text-[#123f32]">
                Profil Terbaru
              </h2>
              <p className="text-xs text-[#4a5550]">
                Maksimal 5 profil yang baru didaftarkan ke platform
              </p>
            </div>

            {recentBusinesses.length > 0 && (
              <button
                type="button"
                id="admin-btn-see-all-profiles"
                onClick={() => setShowAllModal(true)}
                className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] px-3 py-1.5 text-xs font-semibold text-[#123f32] transition-colors hover:bg-[#e7efe9] hover:border-[#123f32]/40"
              >
                <span>Lihat Semua ({recentBusinesses.length})</span>
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>

          {/* List / Table Content */}
          <div>
            {recentBusinesses.length === 0 ? (
              <div className="py-12 text-center">
                <Layers className="mx-auto size-8 text-[#526059]" />
                <p className="mt-2 text-sm font-semibold text-[#14382f]">
                  Belum Ada Profil Bisnis
                </p>
                <p className="mt-1 text-xs text-[#526059]">
                  Profil UMKM yang dibuat akan tampil pada daftar ini.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop & Tablet Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#d8d8cf] text-[#123f32]">
                        <th className="py-2.5 font-semibold">Bisnis</th>
                        <th className="py-2.5 font-semibold">Kategori & Lokasi</th>
                        <th className="py-2.5 font-semibold">Tanggal</th>
                        <th className="py-2.5 font-semibold">Publikasi</th>
                        <th className="py-2.5 font-semibold">Verifikasi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d8d8cf]/60">
                      {displayedProfiles.map((business) => (
                        <tr
                          key={business.id}
                          className="transition-colors hover:bg-[#f5f2e9]/60"
                        >
                          <td className="py-3 pr-3 font-semibold text-[#14382f]">
                            {business.name}
                          </td>
                          <td className="py-3 pr-3 text-[#4a5550]">
                            <span>{business.category || "-"}</span>
                            <span className="mx-1 text-[#d8d8cf]">•</span>
                            <span>{business.location || "-"}</span>
                          </td>
                          <td className="py-3 pr-3 text-[#4a5550] whitespace-nowrap tabular-nums">
                            {formatDate(business.createdAt)}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                                business.status === "published"
                                  ? "bg-[#e7efe9] text-[#123f32] border-[#b7df68]/60"
                                  : business.status === "draft"
                                  ? "bg-[#f5f2e9] text-[#4a5550] border-[#d8d8cf]"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {business.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {business.verified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#123f32] px-2.5 py-0.5 text-[11px] font-medium text-white shadow-2xs">
                                <CheckCircle2 className="size-3 text-[#b7df68]" />
                                Terverifikasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-[#d8d8cf] bg-[#fbfaf6] px-2.5 py-0.5 text-[11px] font-medium text-[#4a5550]">
                                Belum
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (eliminates horizontal overflow) */}
                <div className="block sm:hidden divide-y divide-[#d8d8cf]/70">
                  {displayedProfiles.map((business) => (
                    <div key={business.id} className="py-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-[#14382f]">
                          {business.name}
                        </span>
                        <span className="text-[11px] text-[#4a5550] whitespace-nowrap tabular-nums">
                          {formatDate(business.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#4a5550]">
                        {business.category || "-"} · {business.location || "-"}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            business.status === "published"
                              ? "bg-[#e7efe9] text-[#123f32] border-[#b7df68]/60"
                              : business.status === "draft"
                              ? "bg-[#f5f2e9] text-[#4a5550] border-[#d8d8cf]"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          Publikasi: {business.status}
                        </span>
                        {business.verified ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#123f32] px-2 py-0.5 text-[10px] font-medium text-white">
                            <CheckCircle2 className="size-2.5 text-[#b7df68]" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-[#d8d8cf] bg-[#fbfaf6] px-2 py-0.5 text-[10px] font-medium text-[#4a5550]">
                            Belum Diverifikasi
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-[#d8d8cf] pt-3 text-xs text-[#4a5550] flex items-center justify-between">
            <span>
              Menampilkan {displayedProfiles.length} dari {recentBusinesses.length} profil terkini
            </span>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-[#123f32] hover:underline font-semibold"
            >
              <span>Jelajah Publik</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </section>
      </div>

      {/* 4. Modal / Dialog: "Lihat Semua Profil Terbaru" */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-recent-profiles-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d8d8cf] p-4 sm:p-5">
              <div>
                <h3
                  id="modal-recent-profiles-title"
                  className="text-lg font-bold text-[#123f32]"
                >
                  Daftar Profil Bisnis Terbaru
                </h3>
                <p className="text-xs text-[#4a5550]">
                  Menampilkan hingga {recentBusinesses.length} profil bisnis terbaru dari API Overview CMS
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setShowAllModal(false)}
                className="flex size-8 items-center justify-center rounded-lg border border-[#d8d8cf] text-[#4a5550] hover:bg-[#e7efe9] hover:text-[#123f32]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Scope Disclaimer Banner */}
            <div className="bg-[#f5f2e9] border-b border-[#d8d8cf] px-4 py-2.5 text-xs text-[#14382f]">
              <span className="font-semibold text-[#123f32]">Catatan Data:</span> API Overview saat ini membatasi sampel data hingga 10 profil terbaru. Direktori lengkap dengan pencarian dan filter arsip akan disediakan pada modul <strong>Manajemen UMKM</strong>.
            </div>

            {/* Modal Body / Table */}
            <div className="overflow-y-auto p-4 sm:p-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#d8d8cf] text-[#123f32]">
                    <th className="py-2.5 font-semibold">Nama Bisnis</th>
                    <th className="py-2.5 font-semibold">Kategori & Lokasi</th>
                    <th className="py-2.5 font-semibold">Terdaftar</th>
                    <th className="py-2.5 font-semibold">Status Publikasi</th>
                    <th className="py-2.5 font-semibold">Verifikasi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d8cf]/60">
                  {recentBusinesses.map((business) => (
                    <tr
                      key={business.id}
                      className="transition-colors hover:bg-[#f5f2e9]/60"
                    >
                      <td className="py-3 pr-3 font-semibold text-[#14382f]">
                        {business.name}
                      </td>
                      <td className="py-3 pr-3 text-[#4a5550]">
                        <span>{business.category || "-"}</span>
                        <span className="mx-1 text-[#d8d8cf]">•</span>
                        <span>{business.location || "-"}</span>
                      </td>
                      <td className="py-3 pr-3 text-[#4a5550] whitespace-nowrap tabular-nums">
                        {formatDate(business.createdAt)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            business.status === "published"
                              ? "bg-[#e7efe9] text-[#123f32] border-[#b7df68]/60"
                              : business.status === "draft"
                              ? "bg-[#f5f2e9] text-[#4a5550] border-[#d8d8cf]"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {business.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {business.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#123f32] px-2.5 py-0.5 text-[11px] font-medium text-white shadow-2xs">
                            <CheckCircle2 className="size-3 text-[#b7df68]" />
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-[#d8d8cf] bg-[#fbfaf6] px-2.5 py-0.5 text-[11px] font-medium text-[#4a5550]">
                            Belum
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#d8d8cf] bg-[#fbfaf6] p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] px-4 py-2 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
