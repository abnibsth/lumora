"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  Bookmark,
  Building2,
  CheckCircle2,
  Handshake,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpRight,
  BookmarkCheck,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { businessAge, resolveBusinessCover } from "@/lib/business";
import { ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";
import type { PartnerProfile, PartnerDashboardView } from "@/types/partner";
import type { User } from "@/types/user";

export function PartnerOverview({
  user,
  profile,
  bookmarks,
  recentBusinesses,
  onNavigate,
  onToggleBookmark,
  pendingSlug,
}: {
  user: User;
  profile: PartnerProfile;
  bookmarks: Business[];
  recentBusinesses: Business[];
  onNavigate: (view: PartnerDashboardView) => void;
  onToggleBookmark: (slug: string) => Promise<void>;
  pendingSlug: string | null;
}) {
  const completeness = profile.completeness || 0;
  const isProfileComplete = completeness >= 80;
  const savedSlugs = new Set(bookmarks.map((b) => b.slug));
  const recentSaved = bookmarks.slice(0, 3);
  const discoveryItems = recentBusinesses.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-soft-green/60 px-3.5 py-1 text-xs font-semibold text-forest">
            <Sparkles className="size-3.5 text-forest" />
            <span>Workspace Mitra LUMORA</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-forest sm:text-4xl">
            Selamat datang kembali, {user.name}
          </h1>
          <p className="text-base leading-relaxed text-muted sm:text-lg">
            Temukan potensi UMKM lokal terbaik di seluruh Indonesia, kelola preferensi
            kemitraan organisasi Anda, dan persiapkan peluang kolaborasi strategis yang berdampak nyata.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate("explore")}
              className={buttonStyles({
                variant: "primary",
                className: "gap-2 shadow-xs",
              })}
            >
              <Compass className="size-4" />
              <span>Jelajahi UMKM</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className={buttonStyles({
                variant: "secondary",
                className: "gap-2",
              })}
            >
              <Building2 className="size-4" />
              <span>Lengkapi Profil Mitra</span>
            </button>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <section aria-label="Ringkasan Metrik Mitra">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Bisnis Tersimpan */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-forest/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Bisnis Tersimpan
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-forest">
                  {bookmarks.length}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-soft-green text-forest">
                <Bookmark className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => onNavigate("saved")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
              >
                <span>Lihat semua bookmark</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Kelengkapan Profil */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-forest/30">
            <div className="flex items-start justify-between">
              <div className="w-full mr-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Kelengkapan Profil
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight text-forest">
                    {completeness}%
                  </p>
                  <span className="text-xs text-muted">
                    {isProfileComplete ? "Lengkap" : "Perlu dilengkapi"}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-soft-green">
                  <div
                    className="h-full rounded-full bg-forest transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, completeness))}%` }}
                  />
                </div>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-green text-forest">
                <Building2 className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => onNavigate("profile")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
              >
                <span>Perbarui profil mitra</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Kategori Diminati */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-forest/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Kategori Diminati
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-forest">
                  {profile.interestedCategories.length}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-soft-green text-forest">
                <Compass className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => onNavigate("preferences")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
              >
                <span>Atur preferensi</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Permintaan Kolaborasi */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-forest/30">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Kolaborasi
                  </p>
                  <span className="rounded bg-soft-green px-1.5 py-0.5 text-[9px] font-semibold text-forest">
                    Segera Hadir
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-forest">
                  0
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-soft-green text-forest">
                <Handshake className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60">
              <p className="text-xs text-muted">
                Fitur pesan & inisiasi resmi sedang disiapkan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Profil Incomplete Reminder */}
      {!isProfileComplete ? (
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-forest/20 bg-soft-green/50 p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-forest text-lime">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-forest">
                Tingkatkan Kelengkapan Profil Organisasi Anda ({completeness}%)
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Lengkapi deskripsi perusahaan, jenis mitra, dan kontak resmi agar UMKM dapat
                mengenal profil kredibel organisasi Anda saat berkolaborasi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className={buttonStyles({
              variant: "primary",
              size: "sm",
              className: "shrink-0",
            })}
          >
            Lengkapi Sekarang
          </button>
        </section>
      ) : null}

      {/* Quick Saved Businesses */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest sm:text-2xl">
              Bisnis Tersimpan
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Daftar usaha yang telah Anda tandai untuk evaluasi kemitraan.
            </p>
          </div>
          {bookmarks.length > 0 ? (
            <button
              type="button"
              onClick={() => onNavigate("saved")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              <span>Lihat semua ({bookmarks.length})</span>
              <ArrowRight className="size-4" />
            </button>
          ) : null}
        </div>

        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface py-12 px-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-soft-green text-forest">
              <Bookmark className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-forest">
              Belum ada bisnis yang disimpan
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted">
              Tandai UMKM menarik saat menjelajah katalog agar dapat Anda pelajari dan hubungi kembali di lain waktu.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("explore")}
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "mt-4 gap-2",
              })}
            >
              <Compass className="size-4" />
              <span>Jelajahi Katalog UMKM</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recentSaved.map((biz) => {
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
                        aria-label={`Hapus bookmark ${biz.name}`}
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

                    <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                      <Link
                        href={ROUTES.business(biz.slug)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
                      >
                        <span>Lihat Profil Lengkap</span>
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Discovery Section: Published UMKM */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest sm:text-2xl">
              Rekomendasi UMKM Terbaru
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Pilihan bisnis terverifikasi yang siap membuka peluang kemitraan strategis.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("explore")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline self-start sm:self-auto"
          >
            <span>Buka Eksplorasi Lengkap</span>
            <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {discoveryItems.map((biz) => {
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
                      className="flex size-8 items-center justify-center rounded-lg bg-surface/90 text-forest backdrop-blur-xs transition-colors hover:bg-surface"
                    >
                      <Bookmark
                        className={`size-4 ${isSaved ? "fill-forest text-forest" : "text-forest"}`}
                      />
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
                      {biz.seeking.slice(0, 2).map((item) => (
                        <span
                          key={item}
                          className="rounded-md bg-soft-green/70 px-2 py-0.5 text-[10px] font-medium text-forest"
                        >
                          Mencari {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                    <Link
                      href={ROUTES.business(biz.slug)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
                    >
                      <span>Lihat Detail & Pitch</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

