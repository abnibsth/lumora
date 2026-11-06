"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Search,
  MapPin,
  Calendar,
  Compass,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { businessAge, resolveBusinessCover, formatSeekingLabel } from "@/lib/business";
import { ROUTES } from "@/lib/constants";
import { BUSINESS_CATEGORIES, type Business } from "@/types/business";
import type { PartnerDashboardView } from "@/types/partner";

export function PartnerSavedView({
  bookmarks,
  onNavigate,
  onToggleBookmark,
  pendingSlug,
}: {
  bookmarks: Business[];
  onNavigate: (view: PartnerDashboardView) => void;
  onToggleBookmark: (slug: string) => Promise<void>;
  pendingSlug: string | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  const filteredBusinesses = useMemo(() => {
    return bookmarks.filter((biz) => {
      const matchesCategory =
        selectedCategory === "Semua" || biz.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        biz.name.toLowerCase().includes(q) ||
        biz.location.toLowerCase().includes(q) ||
        biz.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [bookmarks, selectedCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-soft-green/60 px-3 py-0.5 text-xs font-semibold text-forest">
            <Bookmark className="size-3.5 fill-forest" />
            <span>Koleksi Kemitraan</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
            Bisnis Tersimpan
          </h1>
          <p className="mt-1 text-sm text-muted">
            {bookmarks.length} UMKM telah Anda simpan untuk dipelajari lebih mendalam dan disiapkan
            untuk inisiasi kolaborasi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("explore")}
          className={buttonStyles({
            variant: "secondary",
            className: "gap-2 self-start sm:self-auto",
          })}
        >
          <Compass className="size-4" />
          <span>Jelajahi UMKM Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      {bookmarks.length > 0 ? (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, kota, atau produk..."
              className="w-full rounded-xl border border-line bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("Semua")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "Semua"
                  ? "bg-forest text-lime shadow-xs"
                  : "border border-line bg-white text-forest hover:bg-soft-green/50"
              }`}
            >
              Semua ({bookmarks.length})
            </button>
            {BUSINESS_CATEGORIES.map((cat) => {
              const count = bookmarks.filter((b) => b.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-forest text-lime shadow-xs"
                      : "border border-line bg-white text-forest hover:bg-soft-green/50"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Grid or Empty State */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface py-16 px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-soft-green text-forest">
            <Bookmark className="size-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-forest">
            Belum ada bisnis yang disimpan
          </h2>
          <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted leading-relaxed">
            Jelajahi direktori UMKM Indonesia di LUMORA, dan klik ikon bookmark pada profil bisnis
            yang menarik perhatian Anda untuk menyimpannya di halaman ini.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("explore")}
            className={buttonStyles({
              variant: "primary",
              size: "lg",
              className: "mt-6 gap-2",
            })}
          >
            <Compass className="size-4" />
            <span>Mulai Jelajahi UMKM</span>
          </button>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface py-12 px-4 text-center">
          <SlidersHorizontal className="size-8 text-muted" />
          <h3 className="mt-3 text-sm font-semibold text-forest">
            Tidak ada bisnis tersimpan yang cocok
          </h3>
          <p className="mt-1 text-xs text-muted">
            Coba ubah kata kunci pencarian atau bersihkan filter kategori.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Semua");
            }}
            className={buttonStyles({
              variant: "secondary",
              size: "sm",
              className: "mt-4",
            })}
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((biz) => {
            const cover = resolveBusinessCover(biz.slug, biz.coverImage, biz.name);
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
                      aria-label={`Hapus ${biz.name} dari bookmark`}
                      title="Hapus dari bookmark"
                      className="flex size-8 items-center justify-center rounded-lg bg-surface/90 text-forest backdrop-blur-xs transition-colors hover:bg-surface"
                    >
                      <BookmarkCheck className="size-4 fill-forest text-forest" />
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

                  {biz.seeking && biz.seeking.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {biz.seeking.map((need) => (
                        <span
                          key={need}
                          className="rounded-md bg-soft-green/80 px-2 py-0.5 text-[10px] font-medium text-forest"
                        >
                          Mencari {formatSeekingLabel(need)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                    <Link
                      href={ROUTES.business(biz.slug)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
                    >
                      <span>Lihat Profil Lengkap</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(biz.slug)}
                      disabled={isPending}
                      className="text-[11px] font-medium text-red-700 hover:text-red-800 transition-colors"
                    >
                      Hapus
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

