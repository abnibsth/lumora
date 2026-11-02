"use client";

import { useMemo } from "react";
import {
  Handshake,
  CheckSquare,
  Boxes,
  Sparkles,
  HeartHandshake,
  Truck,
  Users,
  Receipt,
  Wallet,
  Layers,
  type LucideIcon,
} from "lucide-react";
import type { BmcEntry } from "@/types/business";
import { cn } from "@/lib/utils";

interface BmcBlockConfig {
  id: string;
  title: string;
  englishTitle: string;
  subtitle: string;
  icon: LucideIcon;
  order: number;
}

const BMC_CANONICAL_BLOCKS: Record<string, BmcBlockConfig> = {
  partners: {
    id: "partners",
    title: "Mitra Utama",
    englishTitle: "Key Partners",
    subtitle: "Pemasok dan rekanan operasional kunci",
    icon: Handshake,
    order: 1,
  },
  activities: {
    id: "activities",
    title: "Aktivitas Utama",
    englishTitle: "Key Activities",
    subtitle: "Operasional inti yang menggerakkan usaha",
    icon: CheckSquare,
    order: 2,
  },
  resources: {
    id: "resources",
    title: "Sumber Daya Utama",
    englishTitle: "Key Resources",
    subtitle: "Aset fisik, tim, modal, dan keahlian",
    icon: Boxes,
    order: 3,
  },
  value: {
    id: "value",
    title: "Proposisi Nilai",
    englishTitle: "Value Propositions",
    subtitle: "Solusi dan nilai unggul yang ditawarkan",
    icon: Sparkles,
    order: 4,
  },
  relationships: {
    id: "relationships",
    title: "Hubungan Pelanggan",
    englishTitle: "Customer Relationships",
    subtitle: "Cara berinteraksi dan menjaga loyalitas",
    icon: HeartHandshake,
    order: 5,
  },
  channels: {
    id: "channels",
    title: "Saluran",
    englishTitle: "Channels",
    subtitle: "Media distribusi dan pemasaran produk",
    icon: Truck,
    order: 6,
  },
  customers: {
    id: "customers",
    title: "Segmen Pelanggan",
    englishTitle: "Customer Segments",
    subtitle: "Profil target pembeli dan konsumen utama",
    icon: Users,
    order: 7,
  },
  costs: {
    id: "costs",
    title: "Struktur Biaya",
    englishTitle: "Cost Structure",
    subtitle: "Pengeluaran dan beban operasional terbesar",
    icon: Receipt,
    order: 8,
  },
  revenue: {
    id: "revenue",
    title: "Sumber Pendapatan",
    englishTitle: "Revenue Streams",
    subtitle: "Arus pemasukan dan model monetisasi",
    icon: Wallet,
    order: 9,
  },
};

function normalizeBmcKey(label: string): string {
  const norm = label.toLowerCase().trim();
  if (norm.includes("mitra") || norm.includes("partner")) return "partners";
  if (norm.includes("aktivitas") || norm.includes("activity") || norm.includes("kegiatan")) return "activities";
  if (norm.includes("sumber daya") || norm.includes("resource")) return "resources";
  if (norm.includes("proposisi") || norm.includes("value") || norm.includes("nilai")) return "value";
  if (norm.includes("hubungan") || norm.includes("relationship") || norm.includes("relasi")) return "relationships";
  if (norm.includes("saluran") || norm.includes("channel") || norm.includes("distribusi")) return "channels";
  if (norm.includes("segmen") || norm.includes("customer") || norm.includes("pelanggan") || norm.includes("target")) return "customers";
  if (norm.includes("biaya") || norm.includes("cost") || norm.includes("pengeluaran")) return "costs";
  if (norm.includes("pendapatan") || norm.includes("revenue") || norm.includes("pemasukan") || norm.includes("penjualan")) return "revenue";
  return "other";
}

interface BusinessBmcCanvasProps {
  entries: BmcEntry[];
  businessName?: string;
  className?: string;
}

export function BusinessBmcCanvas({
  entries,
  className,
}: BusinessBmcCanvasProps) {
  // Map entries into standard Osterwalder slots + any extras
  const { mappedSlots, extraEntries } = useMemo(() => {
    const slots: Record<string, { entry: BmcEntry; config: BmcBlockConfig } | null> = {
      partners: null,
      activities: null,
      resources: null,
      value: null,
      relationships: null,
      channels: null,
      customers: null,
      costs: null,
      revenue: null,
    };
    const extras: BmcEntry[] = [];

    for (const entry of entries) {
      if (!entry.label?.trim() || !entry.value?.trim()) continue;
      const key = normalizeBmcKey(entry.label);
      if (key in slots) {
        if (!slots[key]) {
          slots[key] = { entry, config: BMC_CANONICAL_BLOCKS[key] };
        } else {
          // If duplicate slot exists, append value so no text is lost
          slots[key]!.entry.value += `\n\n${entry.value}`;
        }
      } else {
        extras.push(entry);
      }
    }

    // Fill missing standard slots from canonical definitions if needed
    for (const key of Object.keys(slots)) {
      if (!slots[key]) {
        slots[key] = {
          entry: {
            label: BMC_CANONICAL_BLOCKS[key].title,
            value: "Belum dicantumkan oleh pemilik usaha.",
          },
          config: BMC_CANONICAL_BLOCKS[key],
        };
      }
    }

    return { mappedSlots: slots, extraEntries: extras };
  }, [entries]);

  const p = mappedSlots.partners!;
  const a = mappedSlots.activities!;
  const r = mappedSlots.resources!;
  const v = mappedSlots.value!;
  const cr = mappedSlots.relationships!;
  const ch = mappedSlots.channels!;
  const cs = mappedSlots.customers!;
  const co = mappedSlots.costs!;
  const re = mappedSlots.revenue!;

  return (
    <div className={cn("w-full", className)}>
      {/* 
        DESKTOP LAYOUT (>= 1024px): 
        Classic 5-Column Osterwalder Business Model Canvas
        Col 1: Key Partners (Row span 2)
        Col 2: Key Activities (Row 1), Key Resources (Row 2)
        Col 3: Value Propositions (Row span 2 - Central Highlight)
        Col 4: Customer Relationships (Row 1), Channels (Row 2)
        Col 5: Customer Segments (Row span 2)
        Bottom Row: Cost Structure & Revenue Streams (Spanning full width)
      */}
      <div className="hidden lg:block">
        {/* Top 5-Column Grid */}
        <div className="grid grid-cols-5 gap-3.5 xl:gap-4 auto-rows-fr">
          {/* Col 1: Key Partners */}
          <BmcBlockCard
            item={p}
            className="col-start-1 row-span-2 flex flex-col justify-between"
          />

          {/* Col 2: Key Activities & Key Resources */}
          <BmcBlockCard
            item={a}
            className="col-start-2 row-start-1 flex flex-col justify-between"
          />
          <BmcBlockCard
            item={r}
            className="col-start-2 row-start-2 flex flex-col justify-between"
          />

          {/* Col 3: Value Propositions (Visual Centerpiece!) */}
          <BmcBlockCard
            item={v}
            isHighlighted
            className="col-start-3 row-span-2 flex flex-col justify-between"
          />

          {/* Col 4: Customer Relationships & Channels */}
          <BmcBlockCard
            item={cr}
            className="col-start-4 row-start-1 flex flex-col justify-between"
          />
          <BmcBlockCard
            item={ch}
            className="col-start-4 row-start-2 flex flex-col justify-between"
          />

          {/* Col 5: Customer Segments */}
          <BmcBlockCard
            item={cs}
            className="col-start-5 row-span-2 flex flex-col justify-between"
          />
        </div>

        {/* Bottom Row: Cost Structure & Revenue Streams */}
        <div className="mt-3.5 xl:mt-4 grid grid-cols-2 gap-3.5 xl:gap-4">
          <BmcBlockCard item={co} className="flex flex-col justify-between" />
          <BmcBlockCard item={re} className="flex flex-col justify-between" />
        </div>
      </div>

      {/* 
        MOBILE & TABLET LAYOUT (< 1024px):
        Reflows into a readable single-column / 2-column layout.
        Value Proposition is highlighted prominently on top.
      */}
      <div className="lg:hidden flex flex-col gap-3.5 sm:gap-4">
        {/* Highlighted Value Proposition on Top */}
        <BmcBlockCard item={v} isHighlighted className="w-full" />

        {/* 2-Column Responsive Flow for Supporting Elements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <BmcBlockCard item={cs} />
          <BmcBlockCard item={cr} />
          <BmcBlockCard item={ch} />
          <BmcBlockCard item={a} />
          <BmcBlockCard item={r} />
          <BmcBlockCard item={p} />
          <BmcBlockCard item={co} />
          <BmcBlockCard item={re} />
        </div>
      </div>

      {/* Render any non-standard custom entries if present */}
      {extraEntries.length > 0 && (
        <div className="mt-6 border-t border-line/60 pt-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            <Layers className="size-3.5 text-accent" />
            <span>Elemen Tambahan Canvas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {extraEntries.map((entry, idx) => (
              <div
                key={`extra-${idx}`}
                className="rounded-xl border border-line/70 bg-surface p-4 shadow-2xs"
              >
                <p className="text-xs font-bold text-forest uppercase tracking-wider">
                  {entry.label}
                </p>
                <p className="mt-2 text-xs sm:text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">
                  {entry.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface BmcBlockCardProps {
  item: { entry: BmcEntry; config: BmcBlockConfig };
  isHighlighted?: boolean;
  className?: string;
}

function BmcBlockCard({
  item,
  isHighlighted = false,
  className,
}: BmcBlockCardProps) {
  const { config, entry } = item;
  const Icon = config.icon;
  const isPlaceholder = entry.value === "Belum dicantumkan oleh pemilik usaha.";

  return (
    <div
      className={cn(
        "group relative rounded-xl border p-4 sm:p-5 transition-all duration-200",
        isHighlighted
          ? "border-forest/40 bg-soft-green/30 shadow-xs hover:border-forest/60 hover:shadow-sm"
          : "border-line/70 bg-ivory/40 hover:border-line-strong hover:bg-surface/80 hover:shadow-2xs",
        className
      )}
    >
      {/* Block Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                isHighlighted
                  ? "bg-forest text-lime"
                  : "bg-surface text-forest border border-line/60 group-hover:border-forest/30"
              )}
            >
              <Icon className="size-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-forest leading-tight">
                {config.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-medium text-muted tracking-tight">
                {config.englishTitle}
              </p>
            </div>
          </div>

          {/* Focal Badge for Value Proposition */}
          {isHighlighted && (
            <span className="shrink-0 rounded-full bg-forest px-2 py-0.5 text-[10px] font-semibold text-lime uppercase tracking-wider">
              Nilai Inti
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="mt-3.5">
          <p
            className={cn(
              "text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words",
              isPlaceholder
                ? "italic text-muted/70 text-xs"
                : isHighlighted
                  ? "text-forest font-medium"
                  : "text-ink/85"
            )}
          >
            {entry.value}
          </p>
        </div>
      </div>

      {/* Subtle Bottom Accent on Highlighted Card */}
      {isHighlighted && (
        <div className="mt-4 pt-3 border-t border-forest/15 flex items-center justify-between text-[11px] text-accent font-medium">
          <span>Fondasi nilai bisnis</span>
          <span className="size-1.5 rounded-full bg-lime" />
        </div>
      )}
    </div>
  );
}

