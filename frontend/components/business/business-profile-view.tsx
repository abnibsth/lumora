"use client";

import Image from "next/image";
import {
  MapPin,
  Calendar,
  Building2,
  Lock,
  Compass,
  CheckCircle2,
  TrendingUp,
  Handshake,
} from "lucide-react";
import type { Business, OwnedBusiness } from "@/types/business";
import { presentProfile } from "@/lib/profile-presentation";
import { BusinessMonogram } from "@/components/business/business-monogram";
import { RevenueChart } from "@/components/business/revenue-chart";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BusinessProfileViewProps {
  business: Business | OwnedBusiness;
  /**
   * If true, renders the view inside a modal preview dialog.
   * Modifies container padding and omits outer page navigation.
   */
  isModal?: boolean;
  /**
   * Unsaved changes flag for preview mode.
   */
  isUnsaved?: boolean;
  /**
   * Optional action slot (e.g. Bookmark button for public page).
   */
  actionSlot?: React.ReactNode;
}

export function BusinessProfileView({
  business,
  isModal = false,
  isUnsaved = false,
  actionSlot,
}: BusinessProfileViewProps) {
  const profile = presentProfile(business);

  // Dynamic sections check for anchor navigation
  const navSections = [
    { id: "tentang", label: "Tentang Usaha", show: Boolean(profile.story || profile.ownerBio || profile.ownerName) },
    { id: "perjalanan", label: "Perjalanan", show: profile.milestones.length > 0 },
    { id: "model-bisnis", label: "Model Bisnis", show: profile.bmc.length > 0 },
    { id: "perkembangan", label: "Perkembangan", show: profile.hasPerformance },
    { id: "kolaborasi", label: "Peluang Kemitraan", show: profile.seeking.length > 0 || Boolean(profile.seekingObjective) },
  ].filter((s) => s.show);

  return (
    <article className={cn("w-full bg-ivory text-ink", isModal ? "pb-8" : "pb-24")}>
      {/* 1. HERO SECTION */}
      <section className="relative">
        {/* Cover Container */}
        <div className={cn("relative mx-auto w-full overflow-hidden", isModal ? "px-4 pt-4 sm:px-6 sm:pt-6" : "max-w-6xl px-4 pt-4 sm:px-6 lg:px-8")}>
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-forest/15 via-soft-green/30 to-mint/40",
              isModal
                ? "h-44 sm:h-56 md:h-64"
                : "h-52 sm:h-72 md:h-84 lg:h-96"
            )}
          >
            {profile.coverImage ? (
              <Image
                src={profile.coverImage}
                alt={`Cover ${profile.name}`}
                fill
                priority={!isModal}
                unoptimized
                sizes={isModal ? "(max-width: 960px) 100vw, 960px" : "(max-width: 1200px) 100vw, 1200px"}
                className="object-cover"
                style={{ objectPosition: profile.coverPosition }}
              />
            ) : (
              /* Editorial LUMORA placeholder with brand texture */
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-forest shadow-xs backdrop-blur-xs w-fit">
                  <Compass className="size-3.5 text-accent" />
                  <span>Profil Usaha LUMORA</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-forest/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Identity & Header Information Card */}
        <div className={cn("relative z-10 mx-auto -mt-10 sm:-mt-12", isModal ? "px-4 sm:px-6" : "max-w-6xl px-4 sm:px-6 lg:px-8")}>
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10 shadow-lift">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              {/* Logo & Main Identity */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {profile.logo ? (
                  <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-surface bg-white shadow-xs">
                    <Image
                      src={profile.logo}
                      alt={`Logo ${profile.name}`}
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <BusinessMonogram
                    name={profile.name}
                    className="size-20 sm:size-24 text-2xl sm:text-3xl rounded-2xl shadow-xs"
                  />
                )}

                <div className="min-w-0 flex-1">
                  {/* Meta Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-forest">
                    <span className="inline-flex items-center gap-1 rounded-md bg-soft-green px-2.5 py-1 text-forest">
                      <Building2 className="size-3 text-accent" />
                      {profile.category}
                    </span>
                    {profile.location && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-ivory px-2.5 py-1 text-muted border border-line/60">
                        <MapPin className="size-3 text-accent" />
                        {profile.location}
                      </span>
                    )}
                    {profile.foundedYearLabel && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-ivory px-2.5 py-1 text-muted border border-line/60">
                        <Calendar className="size-3 text-accent" />
                        {profile.foundedYearLabel}
                      </span>
                    )}
                    {profile.status && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold text-xs",
                          profile.isDraft
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        )}
                      >
                        {profile.isDraft ? "Draft Usaha" : "Terbit Publik"}
                      </span>
                    )}
                    {isUnsaved && (
                      <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-700">
                        Perubahan belum disimpan
                      </span>
                    )}
                  </div>

                  {/* Business Name */}
                  <h1 className="mt-3 break-words font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-forest leading-tight">
                    {profile.name}
                  </h1>

                  {/* Short Description */}
                  {profile.description ? (
                    <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted">
                      {profile.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-muted/80">
                      Pemilik belum menambahkan deskripsi singkat usaha.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Area */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-end shrink-0 pt-2 md:pt-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  {actionSlot && <div className="w-full sm:w-auto [&>div]:w-full [&>div>button]:w-full sm:[&>div>button]:w-auto">{actionSlot}</div>}
                  {/* Contact Owner CTA: Clean, disabled with honest explanation (no fake mailto) */}
                  <div className="relative group/contact w-full sm:w-auto">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className={buttonStyles({
                        variant: "primary",
                        className:
                          "w-full sm:w-auto cursor-not-allowed opacity-60 bg-forest text-white flex items-center justify-center gap-2",
                      })}
                    >
                      <Lock className="size-3.5 text-lime" />
                      <span>Hubungi Pemilik</span>
                    </button>
                    <div className="absolute right-0 top-full mt-2 hidden group-hover/contact:block z-30 w-64 rounded-lg border border-line bg-surface p-2.5 text-xs text-muted shadow-lg">
                      Fitur perpesanan langsung ke pemilik sedang diverifikasi secara bertahap oleh LUMORA demi keamanan UMKM.
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted text-left md:text-right max-w-xs">
                  Hubungi mitra melalui jalur terverifikasi saat fitur perpesanan dirilis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STICKY IN-PAGE NAVIGATION (Only when multiple sections exist & not modal) */}
      {!isModal && navSections.length > 1 && (
        <div className="sticky top-[4.25rem] z-20 mt-8 border-y border-line bg-surface/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Navigasi profil bisnis"
              className="-mx-4 flex gap-6 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {navSections.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="inline-flex min-h-10 shrink-0 items-center border-b-2 border-transparent px-1 text-xs sm:text-sm font-semibold text-forest/80 hover:border-forest hover:text-forest transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* CONTENT WRAPPER */}
      <div className={cn("mx-auto mt-8 space-y-12 sm:space-y-16", isModal ? "px-4 sm:px-6" : "max-w-6xl px-4 sm:px-6 lg:px-8")}>
        {/* SECTION: TENTANG BISNIS & PEMILIK */}
        {(profile.story || profile.ownerBio || profile.ownerName) && (
          <section id="tentang" className="scroll-mt-28">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] items-start">
              {/* Left Column: Story */}
              <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                  Tentang Usaha
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink">
                  Cerita di balik {profile.name}
                </h2>
                {profile.story ? (
                  <div className="mt-5 space-y-4 text-sm sm:text-base leading-relaxed text-ink/80 whitespace-pre-wrap">
                    {profile.story}
                  </div>
                ) : (
                  <p className="mt-5 text-sm italic text-muted">
                    Cerita lengkap usaha ini belum dicantumkan.
                  </p>
                )}
              </div>

              {/* Right Column: Owner Card */}
              <aside className="rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-4">
                  <BusinessMonogram
                    name={profile.ownerName || profile.name}
                    className="size-14 text-xl rounded-xl shadow-xs"
                  />
                  <div>
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-ink">
                      {profile.ownerName || "Pemilik Usaha"}
                    </h3>
                    <p className="text-xs font-medium text-accent">
                      {profile.ownerRole}
                    </p>
                  </div>
                </div>

                {profile.ownerBio ? (
                  <div className="mt-4 border-t border-line/60 pt-4 text-xs sm:text-sm leading-relaxed text-muted whitespace-pre-wrap">
                    {profile.ownerBio}
                  </div>
                ) : (
                  <p className="mt-4 border-t border-line/60 pt-4 text-xs italic text-muted">
                    Biodata pemilik belum diisi.
                  </p>
                )}

                <div className="mt-5 rounded-lg bg-soft-green/50 p-3 text-xs text-forest flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
                  <span>Akun terdaftar dan mengelola profil usaha ini secara mandiri di LUMORA.</span>
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* SECTION: PERJALANAN BISNIS (MILESTONES) */}
        {profile.milestones.length > 0 && (
          <section id="perjalanan" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                Perjalanan Usaha
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink">
                Langkah yang membentuk usaha ini
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted">
                Catatan tonggak pencapaian dan fase tumbuh usaha dari waktu ke waktu.
              </p>
            </div>

            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {profile.milestones.map((item, index) => (
                <li
                  key={`${item.year}-${item.title}-${index}`}
                  className="relative flex flex-col justify-between rounded-xl border border-line/70 bg-ivory/50 p-5 transition-shadow hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/50 pb-3">
                      <span className="font-display text-xl font-bold text-forest">
                        {item.year || "Tahapan"}
                      </span>
                      <span className="size-2 rounded-full bg-lime" />
                    </div>
                    <h3 className="mt-3 font-semibold text-sm sm:text-base text-ink">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* SECTION: MODEL BISNIS (BMC) */}
        {profile.bmc.length > 0 && (
          <section id="model-bisnis" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                Model Bisnis
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink">
                Gambaran cara usaha menciptakan nilai
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted">
                Ringkasan elemen operasional dan model bisnis (Business Model Canvas) yang diterapkan.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.bmc.map((entry, index) => (
                <div
                  key={`${entry.label}-${index}`}
                  className="rounded-xl border border-line/70 bg-ivory/40 p-5 hover:border-forest/30 transition-colors"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
                    {entry.label}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink/80 whitespace-pre-wrap">
                    {entry.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: PERKEMBANGAN BISNIS (METRICS) - Rendered ONLY if valid data exists */}
        {profile.hasPerformance && (
          <section id="perkembangan" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] items-start">
              <div>
                <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                  Perkembangan Usaha
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink">
                  Catatan performa bisnis
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
                  Informasi kinerja dicatat langsung oleh pemilik usaha untuk memberikan gambaran skala bisnis.
                </p>
                <div className="mt-6 flex items-center gap-2 rounded-lg bg-soft-green/60 p-3 text-xs text-forest">
                  <TrendingUp className="size-4 text-accent shrink-0" />
                  <span>Data mandiri untuk kepentingan discovery awal mitra.</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Metric Indicators */}
                {(profile.revenueLabel || profile.growthLabel) && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.revenueLabel && (
                      <div className="rounded-xl border border-line bg-ivory/40 p-5">
                        <dt className="text-xs font-medium text-muted">Pendapatan bulanan</dt>
                        <dd className="mt-2 text-2xl sm:text-3xl font-semibold text-forest">
                          {profile.revenueLabel}
                        </dd>
                      </div>
                    )}
                    {profile.growthLabel && (
                      <div className="rounded-xl border border-line bg-ivory/40 p-5">
                        <dt className="text-xs font-medium text-muted">Pertumbuhan usaha</dt>
                        <dd className="mt-2 text-2xl sm:text-3xl font-semibold text-forest">
                          {profile.growthLabel}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                {/* Safe Revenue Chart */}
                {profile.revenueSeries && profile.revenueSeries.length >= 2 && (
                  <div className="rounded-xl border border-line bg-ivory/40 p-5">
                    <RevenueChart series={profile.revenueSeries} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: PELUANG KOLABORASI (SEEKING) */}
        {(profile.seeking.length > 0 || profile.seekingObjective) && (
          <section id="kolaborasi" className="scroll-mt-28 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] items-start">
              <div>
                <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                  Peluang Kerja Sama
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink">
                  Kemitraan yang sedang dicari
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted">
                  Buka peluang sinergi, pasokan, distribusi, atau pendampingan usaha.
                </p>
              </div>

              <div>
                {/* Tags */}
                {profile.seeking.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {profile.seeking.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-soft-green px-3.5 py-1.5 text-xs sm:text-sm font-medium text-forest"
                      >
                        <Handshake className="size-3.5 text-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Objective */}
                {profile.seekingObjective && (
                  <div className="mt-5 rounded-xl border border-line/60 bg-ivory/40 p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Rencana & Kebutuhan Spesifik
                    </h3>
                    <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink/80 whitespace-pre-wrap">
                      {profile.seekingObjective}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* FOOTER DISCLAIMER */}
      <footer className={cn("mx-auto mt-12 text-center text-xs text-muted", isModal ? "px-4" : "max-w-6xl px-4 sm:px-6 lg:px-8")}>
        <p>
          Informasi profil dihimpun dari pemilik usaha terdaftar. LUMORA adalah platform digital discovery dan storytelling UMKM.
        </p>
      </footer>
    </article>
  );
}
