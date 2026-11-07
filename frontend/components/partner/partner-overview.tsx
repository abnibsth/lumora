"use client";

import { useState } from "react";
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
  SlidersHorizontal,
  Target,
  ShieldCheck,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CollaborationModal } from "@/components/collaboration/collaboration-modal";
import { businessAge, resolveBusinessCover } from "@/lib/business";
import { fetchCollaborationStats } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";
import type {
  PartnerProfile,
  PartnerPreferences,
  PartnerDashboardView,
  BusinessMatchList,
} from "@/types/partner";
import type { User } from "@/types/user";

export function PartnerOverview({
  user,
  profile,
  preferences,
  bookmarks,
  matches,
  onNavigate,
  onToggleBookmark,
  pendingSlug,
}: {
  user: User;
  profile: PartnerProfile;
  preferences: PartnerPreferences;
  bookmarks: Business[];
  matches?: BusinessMatchList;
  onNavigate: (view: PartnerDashboardView) => void;
  onToggleBookmark: (slug: string) => Promise<void>;
  pendingSlug: string | null;
}) {
  const completeness = profile.completeness || 0;
  const isProfileComplete = completeness >= 80;
  const savedSlugs = new Set(bookmarks.map((b) => b.slug));
  const recentSaved = bookmarks.slice(0, 3);
  const matchedItems = matches?.items || [];
  const hasPreferences = preferences.hasPreferences;
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [collabStats, setCollabStats] = useState({ total: 0, pending: 0, accepted: 0 });

  useEffect(() => {
    let active = true;
    fetchCollaborationStats().then((res) => {
      if (active && res.ok && res.stats) setCollabStats(res.stats);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6 pb-8">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:p-7 shadow-xs">
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
              onClick={() => onNavigate("preferences")}
              className={buttonStyles({
                variant: "secondary",
                className: "gap-2",
              })}
            >
              <SlidersHorizontal className="size-4" />
              <span>Atur Preferensi Kemitraan</span>
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

          {/* Card 2: Kelengkapan Profil Organisasi */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-forest/30">
            <div className="flex items-start justify-between">
              <div className="w-full mr-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Profil Organisasi
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
                <span>Kelola profil publik</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Preferensi Kemitraan Status */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-forest/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Kriteria Matching
                </p>
                <p className="mt-2 text-base font-bold text-forest">
                  {hasPreferences ? "Aktif & Tersimpan" : "Belum Diatur"}
                </p>
                <p className="text-[11px] text-muted mt-1">
                  {hasPreferences
                    ? `${preferences.targetCategories.length || "Semua"} Sektor · ${preferences.searchRegion || "Nasional"}`
                    : "Atur kriteria untuk rekomendasi cerdas"}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-soft-green text-forest">
                <SlidersHorizontal className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => onNavigate("preferences")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
              >
                <span>Ubah preferensi</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Kemitraan Aktif */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-forest/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Kemitraan Terbuka
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-forest">
                  {collabStats.accepted}
                </p>
                <p className="text-[11px] text-muted mt-1">
                  {collabStats.pending} pengajuan menunggu respons
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-soft-green text-forest">
                <Handshake className="size-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => onNavigate("requests")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-deep transition-colors"
              >
                <span>Lihat pengajuan kolaborasi</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Incomplete Reminder */}
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

      {/* Section 1: Rekomendasi Cerdas (Smart Partner Matching) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
              <Sparkles className="size-3.5" />
              <span>Smart Partner Matching</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-forest sm:text-2xl mt-1">
              Rekomendasi UMKM untuk Kemitraan Anda
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Dihitung berdasarkan keselarasan sektor, bentuk kolaborasi Master Taxonomy, dan wilayah target Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("explore")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline self-start sm:self-auto"
          >
            <span>Buka Katalog Eksplorasi</span>
            <ArrowRight className="size-4" />
          </button>
        </div>

        {!hasPreferences ? (
          /* Empty State: Preferences Not Set */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-forest/30 bg-surface py-12 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-soft-green text-forest">
              <Target className="size-7" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-forest">
              Preferensi Kemitraan Belum Diatur
            </h3>
            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted leading-relaxed">
              Atur sektor bisnis, wilayah fokus, dan bentuk kolaborasi yang Anda cari agar algoritma matching LUMORA dapat menghitung kecocokan dan menampilkan rekomendasi yang presisi.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("preferences")}
              className={buttonStyles({
                variant: "primary",
                className: "mt-5 gap-2 shadow-xs",
              })}
            >
              <SlidersHorizontal className="size-4" />
              <span>Atur Preferensi Sekarang</span>
            </button>
          </div>
        ) : matchedItems.length === 0 ? (
          /* Empty State: No Matches */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface py-12 px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-soft-green text-forest">
              <Compass className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-forest">
              Belum Ada UMKM yang Sesuai dengan Kriteria Ketat Anda
            </h3>
            <p className="mt-1 max-w-md text-xs text-muted">
              Coba perluas wilayah pencarian atau nonaktifkan pembatasan wilayah ketat pada menu Preferensi Kemitraan.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("preferences")}
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "mt-4",
              })}
            >
              Sesuaikan Preferensi
            </button>
          </div>
        ) : (
          /* Matched Results Grid */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {matchedItems.map((match) => {
              const biz = match.business;
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
                      <div className="flex items-center gap-1.5">
                        <Badge tone="demo">{biz.category}</Badge>
                        <span className="rounded-full bg-forest px-2.5 py-0.5 text-[11px] font-bold text-lime shadow-xs">
                          {match.matchScore}% Cocok
                        </span>
                      </div>
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
                      {biz.verified && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5 text-forest font-semibold">
                            <ShieldCheck className="size-3" />
                            Terverifikasi
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-lg font-semibold text-forest">
                      {biz.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted leading-relaxed">
                      {biz.description}
                    </p>

                    {/* Match Reasons Badges */}
                    {match.reasons && match.reasons.length > 0 && (
                      <div className="mt-3 rounded-lg border border-line/60 bg-soft-green/30 p-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-forest/70">
                          Alasan Kecocokan:
                        </p>
                        <div className="space-y-0.5">
                          {match.reasons.slice(0, 2).map((r, idx) => (
                            <p key={idx} className="text-[11px] text-forest flex items-start gap-1">
                              <span className="text-forest font-bold">✓</span>
                              <span>{r.label}: {r.detail}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-2.5 border-t border-line/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBiz(biz);
                          setCollabModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                      >
                        <Handshake className="size-3.5" />
                        <span>Ajukan Kolaborasi</span>
                      </button>
                      <div className="flex items-center gap-3">
                        <Link
                          href={ROUTES.business(biz.slug)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
                        >
                          <span>Detail</span>
                          <ArrowUpRight className="size-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(biz.slug)}
                          disabled={isPending}
                          className={`text-[11px] font-semibold transition-colors ${
                            isSaved ? "text-forest underline" : "text-muted hover:text-forest"
                          }`}
                        >
                          {isPending ? "..." : isSaved ? "Tersimpan" : "+ Simpan"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Collaboration Modal Dialog */}
      {selectedBiz && (
        <CollaborationModal
          open={collabModalOpen}
          onOpenChange={setCollabModalOpen}
          targetUser={{
            id: selectedBiz.id,
            name: selectedBiz.owner.name,
            role: "umkm",
          }}
          business={selectedBiz}
          currentUser={user}
        />
      )}

      {/* Section 2: Quick Saved Businesses */}
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
    </div>
  );
}
