"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  Search,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Calendar,
  ArrowUpRight,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { fetchBusinesses } from "@/lib/api";
import { businessAge, resolveBusinessCover } from "@/lib/business";
import { ROUTES, SECTION_IDS } from "@/lib/constants";
import { BUSINESS_CATEGORIES, type Business } from "@/types/business";
import type { PartnerPreferences } from "@/types/partner";

export function PartnerExploreView({
  initialBusinesses,
  savedSlugs,
  onToggleBookmark,
  pendingSlug,
  preferences,
}: {
  initialBusinesses: Business[];
  savedSlugs: Set<string>;
  onToggleBookmark: (slug: string) => Promise<void>;
  pendingSlug: string | null;
  preferences?: PartnerPreferences;
}) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [loading, setLoading] = useState(false);
  const [isPendingTransition, startTransition] = useTransition();
  const [preferenceApplied, setPreferenceApplied] = useState(false);

  const hasPreferences = preferences && preferences.hasPreferences;

  function applyPreferencesFilter() {
    if (!preferences || !hasPreferences) return;

    // Apply first target category if configured
    if (preferences.targetCategories && preferences.targetCategories.length > 0) {
      setSelectedCategory(preferences.targetCategories[0]);
    } else {
      setSelectedCategory("Semua");
    }

    // Apply search region as query if configured
    if (preferences.searchRegion) {
      setSearchQuery(preferences.searchRegion);
    } else {
      setSearchQuery("");
    }

    setPreferenceApplied(true);
  }

  function resetFilter() {
    setSearchQuery("");
    setSelectedCategory("Semua");
    setPreferenceApplied(false);
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      startTransition(async () => {
        setLoading(true);
        try {
          const res = await fetchBusinesses({
            q: searchQuery.trim() || undefined,
            category: selectedCategory !== "Semua" ? selectedCategory : undefined,
            limit: 24,
          });
          if (active && res.items) {
            setBusinesses(res.items);
          }
        } catch {
          // Keep current businesses if fetch fails
        } finally {
          if (active) setLoading(false);
        }
      });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-soft-green/60 px-3 py-0.5 text-xs font-semibold text-forest">
            <Compass className="size-3.5" />
            <span>Katalog & Kurasi Bisnis</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
            Jelajahi UMKM Indonesia
          </h1>
          <p className="mt-1 text-sm text-muted">
            Temukan profil usaha potensial, pelajari Business Model Canvas mereka, dan simpan untuk
            peluang kemitraan strategis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasPreferences ? (
            <button
              type="button"
              onClick={applyPreferencesFilter}
              className={buttonStyles({
                variant: preferenceApplied ? "primary" : "secondary",
                className: "gap-2 shadow-xs",
              })}
            >
              <Sparkles className="size-4" />
              <span>{preferenceApplied ? "Preferensi Diterapkan" : "Terapkan Preferensi Saya"}</span>
            </button>
          ) : (
            <Link
              href="/dashboard?view=preferences"
              className={buttonStyles({
                variant: "ghost",
                className: "gap-1.5 text-xs text-muted hover:text-forest",
              })}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Atur Preferensi</span>
            </Link>
          )}

          <Link
            href={`/#${SECTION_IDS.businesses}`}
            className={buttonStyles({
              variant: "secondary",
              className: "gap-2",
            })}
          >
            <span>Buka di Halaman Publik</span>
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Applied Preference Indicator Pill */}
      {preferenceApplied && (
        <div className="flex items-center justify-between rounded-xl border border-forest/20 bg-soft-green/50 px-4 py-2.5 text-xs text-forest">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-forest" />
            <span>
              Menyaring berdasarkan preferensi tersimpan: <strong>{selectedCategory}</strong>
              {searchQuery ? ` · Wilayah &quot;${searchQuery}&quot;` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={resetFilter}
            className="inline-flex items-center gap-1 font-semibold text-forest hover:underline"
          >
            <X className="size-3.5" />
            <span>Reset ke Semua</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPreferenceApplied(false);
            }}
            placeholder="Cari nama bisnis, kota, atau kata kunci..."
            className="w-full rounded-xl border border-line bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("Semua");
              setPreferenceApplied(false);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "Semua"
                ? "bg-forest text-lime shadow-xs"
                : "border border-line bg-white text-forest hover:bg-soft-green/50"
            }`}
          >
            Semua Sektor
          </button>
          {BUSINESS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setPreferenceApplied(false);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-forest text-lime shadow-xs"
                  : "border border-line bg-white text-forest hover:bg-soft-green/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state indicator */}
      {(loading || isPendingTransition) && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-forest">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat data UMKM...</span>
        </div>
      )}

      {/* Businesses Grid */}
      {businesses.length === 0 && !loading && !isPendingTransition ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface py-16 px-4 text-center">
          <SlidersHorizontal className="size-8 text-muted" />
          <h2 className="mt-3 text-base font-semibold text-forest">
            Tidak ada UMKM yang ditemukan
          </h2>
          <p className="mt-1 text-xs text-muted max-w-sm">
            Coba ubah kata kunci pencarian atau pilih kategori sektor yang lain.
          </p>
          <button
            type="button"
            onClick={resetFilter}
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "mt-4",
            })}
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((biz) => {
            const cover = resolveBusinessCover(biz.slug, biz.coverImage, biz.name);
            const isSaved = savedSlugs.has(biz.slug);
            const isPending = pendingSlug === biz.slug;

            return (
              <article
                key={biz.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition-all hover:border-forest/40 hover:shadow-sm"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-mint">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={`Cover ${biz.name}`}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                    <Badge tone="demo">{biz.category}</Badge>
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(biz.slug)}
                      disabled={isPending}
                      aria-label={isSaved ? `Hapus bookmark ${biz.name}` : `Simpan ${biz.name}`}
                      title={isSaved ? "Tersimpan di bookmark" : "Simpan ke bookmark"}
                      className="flex size-8 items-center justify-center rounded-lg bg-surface/90 text-forest backdrop-blur-xs transition-colors hover:bg-surface"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="size-4 fill-forest text-forest" />
                      ) : (
                        <Bookmark className="size-4 text-forest" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {biz.location}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {businessAge(biz.foundedYear)}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-lg font-semibold text-forest">
                    {biz.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted leading-relaxed">
                    {biz.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {biz.growthLabel ? (
                      <span className="rounded bg-lime/40 px-2 py-0.5 text-[10px] font-semibold text-forest">
                        {biz.growthLabel}
                      </span>
                    ) : null}
                    {biz.seeking?.slice(0, 2).map((item) => (
                      <span
                        key={item}
                        className="rounded bg-soft-green px-2 py-0.5 text-[10px] font-medium text-forest"
                      >
                        Mencari {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between">
                    <Link
                      href={ROUTES.business(biz.slug)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
                    >
                      <span>Lihat BMC & Cerita</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(biz.slug)}
                      disabled={isPending}
                      className={`text-[11px] font-semibold transition-colors ${
                        isSaved ? "text-forest underline" : "text-muted hover:text-forest"
                      }`}
                    >
                      {isPending ? "Memproses..." : isSaved ? "Tersimpan" : "+ Simpan"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
