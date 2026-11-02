"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Target,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { Business, OwnedBusiness } from "@/types/business";
import { presentProfile } from "@/lib/profile-presentation";
import { BusinessMonogram } from "@/components/business/business-monogram";
import { RevenueChart } from "@/components/business/revenue-chart";
import { BusinessBmcCanvas } from "@/components/business/business-bmc-canvas";
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
  const navSections = useMemo(
    () =>
      [
        {
          id: "tentang",
          label: "Tentang Usaha",
          show: Boolean(profile.story || profile.ownerBio || profile.ownerName),
        },
        {
          id: "perjalanan",
          label: "Perjalanan",
          show: profile.milestones.length > 0,
        },
        {
          id: "model-bisnis",
          label: "Model Bisnis",
          show: profile.bmc.length > 0,
        },
        {
          id: "perkembangan",
          label: "Perkembangan",
          show: profile.hasPerformance,
        },
        {
          id: "kolaborasi",
          label: "Peluang Kemitraan",
          show:
            profile.seeking.length > 0 || Boolean(profile.seekingObjective),
        },
      ].filter((s) => s.show),
    [profile]
  );

  // Active section for Scroll Spy
  const [activeSection, setActiveSection] = useState<string>(
    navSections[0]?.id || ""
  );

  // Mobile horizontal scroll cues
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkNavScroll = () => {
    if (!navScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    checkNavScroll();
    window.addEventListener("resize", checkNavScroll);
    return () => window.removeEventListener("resize", checkNavScroll);
  }, [navSections]);

  // Scroll Spy via IntersectionObserver
  useEffect(() => {
    if (isModal || navSections.length <= 1) return;

    const sectionElements = navSections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible section
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible && visible.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-25% 0px -65% 0px",
        threshold: [0, 0.2, 0.5],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navSections, isModal]);

  // Chronologically sorted milestones
  const sortedMilestones = useMemo(
    () => [...profile.milestones].sort((a, b) => (a.year || 0) - (b.year || 0)),
    [profile.milestones]
  );

  // Smooth scroll handler
  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <article
      className={cn(
        "w-full bg-ivory text-ink selection:bg-lime selection:text-forest",
        isModal ? "pb-8" : "pb-24 sm:pb-32"
      )}
    >
      {/* 1. HERO SECTION */}
      <section className="relative w-full">
        {/* Cover Container */}
        <div
          className={cn(
            "relative mx-auto w-full",
            isModal
              ? "px-4 pt-4 sm:px-6 sm:pt-6"
              : "max-w-6xl px-4 pt-4 sm:px-6 lg:px-8"
          )}
        >
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-forest/15 via-soft-green/30 to-mint/30 shadow-xs",
              isModal
                ? "h-44 sm:h-56 md:h-64"
                : "h-52 sm:h-72 md:h-80 lg:h-96"
            )}
          >
            {profile.coverImage ? (
              <Image
                src={profile.coverImage}
                alt={`Cover ${profile.name}`}
                fill
                priority={!isModal}
                unoptimized
                sizes={
                  isModal
                    ? "(max-width: 960px) 100vw, 960px"
                    : "(max-width: 1280px) 100vw, 1200px"
                }
                className="object-cover"
                style={{ objectPosition: profile.coverPosition }}
              />
            ) : (
              /* Editorial LUMORA placeholder with warm brand texture */
              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 bg-forest/5">
                <div className="inline-flex items-center gap-2 rounded-full bg-surface/90 px-3.5 py-1.5 text-xs font-semibold text-forest shadow-xs backdrop-blur-xs w-fit">
                  <Compass className="size-3.5 text-accent" />
                  <span>Profil Usaha Terkurasi · LUMORA</span>
                </div>
              </div>
            )}
            {/* Subtle atmospheric vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-forest/50 via-deep-forest/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Identity & Header Information Card (Overlapping Hero) */}
        <div
          className={cn(
            "relative z-10 mx-auto -mt-10 sm:-mt-14 lg:-mt-16",
            isModal ? "px-4 sm:px-6" : "max-w-6xl px-4 sm:px-6 lg:px-8"
          )}
        >
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7 md:p-9 lg:p-10 shadow-lift">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              {/* Logo & Main Identity */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5 min-w-0 flex-1">
                {profile.logo ? (
                  <div className="relative size-20 sm:size-24 md:size-26 shrink-0 overflow-hidden rounded-2xl border-2 border-surface bg-white shadow-xs">
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
                    className="size-20 sm:size-24 md:size-26 text-2xl sm:text-3xl rounded-2xl shadow-xs"
                  />
                )}

                <div className="min-w-0 flex-1">
                  {/* Meta Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-forest">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-soft-green px-2.5 py-1 text-forest font-semibold">
                      <Building2 className="size-3 text-accent" />
                      <span>{profile.category}</span>
                    </span>
                    {profile.location && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-ivory px-2.5 py-1 text-muted border border-line/70">
                        <MapPin className="size-3 text-accent" />
                        <span>{profile.location}</span>
                      </span>
                    )}
                    {profile.foundedYearLabel && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-ivory px-2.5 py-1 text-muted border border-line/70">
                        <Calendar className="size-3 text-accent" />
                        <span>{profile.foundedYearLabel}</span>
                      </span>
                    )}
                    {profile.status && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-xs",
                          profile.isDraft
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        )}
                      >
                        {profile.isDraft ? "Draft Usaha" : "Terbit Publik"}
                      </span>
                    )}
                    {isUnsaved && (
                      <span className="rounded-lg bg-amber-500/10 border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-800">
                        Perubahan belum disimpan
                      </span>
                    )}
                  </div>

                  {/* Business Name */}
                  <h1 className="mt-3.5 break-words font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-forest leading-[1.14]">
                    {profile.name}
                  </h1>

                  {/* Short Description */}
                  {profile.description ? (
                    <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-muted break-words">
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-end shrink-0 pt-2 md:pt-0 border-t border-line/50 md:border-t-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  {actionSlot && (
                    <div className="w-full sm:w-auto">
                      {actionSlot}
                    </div>
                  )}

                  {/* Contact Owner CTA: Clean, disabled with honest explanation */}
                  <div className="relative group/contact w-full sm:w-auto">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className={buttonStyles({
                        variant: "primary",
                        className:
                          "w-full sm:w-auto cursor-not-allowed opacity-65 bg-forest text-white flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl font-semibold",
                      })}
                    >
                      <Lock className="size-3.5 text-lime" />
                      <span>Hubungi Pemilik</span>
                    </button>
                    <div className="absolute right-0 top-full mt-2 hidden group-hover/contact:block group-focus-within/contact:block z-30 w-72 rounded-xl border border-line bg-surface p-3 text-xs text-muted shadow-lg">
                      Fitur perpesanan langsung ke pemilik sedang diverifikasi secara bertahap oleh LUMORA demi keamanan UMKM.
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted text-left md:text-right max-w-xs leading-normal">
                  Hubungi mitra melalui jalur terverifikasi saat fitur perpesanan dirilis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STICKY IN-PAGE NAVIGATION (Only when multiple sections exist & not modal) */}
      {!isModal && navSections.length > 1 && (
        <div className="sticky top-16 z-20 mt-8 border-y border-line bg-surface/95 backdrop-blur-md shadow-2xs">
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Visual gradient cues for mobile horizontal scroll */}
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-surface to-transparent transition-opacity sm:hidden z-10",
                canScrollLeft ? "opacity-100" : "opacity-0"
              )}
            />
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent transition-opacity sm:hidden z-10",
                canScrollRight ? "opacity-100" : "opacity-0"
              )}
            />

            <nav
              ref={navScrollRef}
              onScroll={checkNavScroll}
              aria-label="Navigasi bagian profil bisnis"
              className="-mx-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
            >
              {navSections.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center rounded-xl px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-forest",
                      isActive
                        ? "bg-forest text-white shadow-2xs"
                        : "text-forest/75 hover:bg-soft-green/60 hover:text-forest"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <div
        className={cn(
          "mx-auto mt-8 space-y-12 sm:space-y-16",
          isModal ? "px-4 sm:px-6" : "max-w-6xl px-4 sm:px-6 lg:px-8"
        )}
      >
        {/* SECTION A: TENTANG BISNIS & PEMILIK */}
        {(profile.story || profile.ownerBio || profile.ownerName) && (
          <section
            id="tentang"
            className="scroll-mt-36 sm:scroll-mt-40 focus:outline-none"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Story (Primary Editorial Content) */}
              <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10 shadow-xs">
                <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                  Cerita Usaha
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink leading-tight">
                  Cerita di balik {profile.name}
                </h2>

                {profile.story ? (
                  <div className="mt-5 space-y-4 text-sm sm:text-base leading-relaxed text-ink/85 whitespace-pre-wrap break-words font-normal">
                    {profile.story}
                  </div>
                ) : (
                  <p className="mt-5 text-sm italic text-muted">
                    Cerita lengkap usaha ini belum dicantumkan oleh pemilik.
                  </p>
                )}
              </div>

              {/* Right Column: Founder Profile (Supporting Info) */}
              <aside className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-line bg-surface p-6 sm:p-7 shadow-xs">
                <div className="flex items-center gap-4">
                  <BusinessMonogram
                    name={profile.ownerName || profile.name}
                    className="size-14 text-xl rounded-xl shadow-xs"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-ink leading-snug break-words">
                      {profile.ownerName || "Pemilik Usaha"}
                    </h3>
                    <p className="text-xs font-semibold text-accent mt-0.5">
                      {profile.ownerRole}
                    </p>
                  </div>
                </div>

                {profile.ownerBio ? (
                  <div className="mt-4 border-t border-line/60 pt-4 text-xs sm:text-sm leading-relaxed text-muted whitespace-pre-wrap break-words">
                    {profile.ownerBio}
                  </div>
                ) : (
                  <p className="mt-4 border-t border-line/60 pt-4 text-xs italic text-muted">
                    Biodata pendiri belum diisi.
                  </p>
                )}

                <div className="mt-5 rounded-xl bg-soft-green/50 p-3.5 text-xs text-forest flex items-start gap-2.5 border border-forest/10">
                  <ShieldCheck className="size-4 text-accent shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Akun terverifikasi mengelola profil usaha ini secara mandiri di platform LUMORA.
                  </span>
                </div>
              </aside>
            </div>
          </section>
        )}

        {/* SECTION B: PERJALANAN BISNIS (MILESTONES) */}
        {sortedMilestones.length > 0 && (
          <section
            id="perjalanan"
            className="scroll-mt-36 sm:scroll-mt-40 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10 shadow-xs focus:outline-none"
          >
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                Perjalanan Usaha
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink leading-tight">
                Langkah yang membentuk usaha ini
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Catatan tonggak pencapaian dan fase tumbuh usaha berdasarkan urutan tahun perkembangan.
              </p>
            </div>

            {/* Mobile Vertical Timeline (< 768px) */}
            <div className="mt-8 md:hidden relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-line-strong/30 space-y-7">
              {sortedMilestones.map((item, index) => (
                <div key={`m-mobile-${item.year}-${index}`} className="relative group">
                  {/* Timeline Node Marker */}
                  <div className="absolute -left-6 top-1 size-5 rounded-full border-2 border-forest bg-surface flex items-center justify-center shadow-xs">
                    <span className="size-1.5 rounded-full bg-lime" />
                  </div>

                  {/* Content Card */}
                  <div className="rounded-xl border border-line/70 bg-ivory/40 p-4 transition-colors">
                    <span className="inline-flex items-center rounded-md bg-forest px-2.5 py-0.5 text-xs font-bold text-white">
                      {item.year || "Tahapan"}
                    </span>
                    <h3 className="mt-2.5 font-semibold text-sm text-ink leading-snug break-words">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1.5 text-xs text-muted leading-relaxed whitespace-pre-wrap break-words">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Connected Timeline (>= 768px) */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mt-8">
              {sortedMilestones.map((item, index) => (
                <div
                  key={`m-desktop-${item.year}-${index}`}
                  className="group relative flex flex-col justify-between rounded-xl border border-line/70 bg-ivory/40 p-5 transition-all duration-200 hover:border-forest/40 hover:bg-surface hover:shadow-xs"
                >
                  <div>
                    {/* Header with Year badge & visual connector cue */}
                    <div className="flex items-center justify-between border-b border-line/60 pb-3">
                      <span className="font-display text-2xl font-bold text-forest">
                        {item.year || "Tahapan"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                          Fase {index + 1}
                        </span>
                        <span className="size-2 rounded-full bg-lime" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mt-3.5 font-semibold text-base text-ink leading-snug break-words">
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted whitespace-pre-wrap break-words">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION C: MODEL BISNIS (BUSINESS MODEL CANVAS) */}
        {profile.bmc.length > 0 && (
          <section
            id="model-bisnis"
            className="scroll-mt-36 sm:scroll-mt-40 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10 shadow-xs focus:outline-none"
          >
            <div className="max-w-3xl">
              <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                Model Bisnis
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink leading-tight">
                Gambaran cara usaha menciptakan dan menyalurkan nilai
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Struktur Business Model Canvas konvensional sembilan blok: operasional internal, proposisi nilai utama, interaksi pelanggan, dan fondasi keuangan.
              </p>
            </div>

            {/* Standard 5-Column BMC Grid on Desktop / Responsive on Mobile */}
            <div className="mt-8">
              <BusinessBmcCanvas
                entries={profile.bmc}
                businessName={profile.name}
              />
            </div>
          </section>
        )}

        {/* SECTION D: PERKEMBANGAN BISNIS (METRICS & REVENUE CHART) */}
        {profile.hasPerformance && (
          <section
            id="perkembangan"
            className="scroll-mt-36 sm:scroll-mt-40 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10 shadow-xs focus:outline-none"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Context Summary */}
              <div className="lg:col-span-5">
                <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                  Perkembangan Usaha
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink leading-tight">
                  Catatan performa dan skala bisnis
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
                  Informasi kinerja dicatat langsung oleh pemilik usaha untuk memberikan gambaran skala operasional bagi calon mitra.
                </p>

                <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-soft-green/60 p-3.5 text-xs text-forest border border-forest/10">
                  <TrendingUp className="size-4 text-accent shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Data mandiri sebagai indikator pertumbuhan awal, bukan laporan keuangan yang diaudit publik.
                  </span>
                </div>
              </div>

              {/* Metrics & Chart Container */}
              <div className="lg:col-span-7 space-y-6">
                {/* 2 Main Metric KPI Cards */}
                {(profile.revenueLabel || profile.growthLabel) && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.revenueLabel && (
                      <div className="rounded-xl border border-line/80 bg-ivory/50 p-5 shadow-2xs">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Pendapatan Bulanan
                        </dt>
                        <dd className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-forest">
                          {profile.revenueLabel}
                        </dd>
                        <p className="mt-1 text-[11px] text-muted">Rata-rata pendapatan aktif</p>
                      </div>
                    )}
                    {profile.growthLabel && (
                      <div className="rounded-xl border border-line/80 bg-ivory/50 p-5 shadow-2xs">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Pertumbuhan Usaha
                        </dt>
                        <dd className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-forest">
                          {profile.growthLabel}
                        </dd>
                        <p className="mt-1 text-[11px] text-muted">Laju pertumbuhan tahunan / kuartal</p>
                      </div>
                    )}
                  </dl>
                )}

                {/* Safe Revenue Chart with full width */}
                {profile.revenueSeries && profile.revenueSeries.length >= 2 && (
                  <div className="rounded-xl border border-line/80 bg-ivory/40 p-5 sm:p-6 shadow-2xs">
                    <RevenueChart series={profile.revenueSeries} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION E: PELUANG KOLABORASI (PARTNERSHIP OPPORTUNITY) */}
        {(profile.seeking.length > 0 || profile.seekingObjective) && (
          <section
            id="kolaborasi"
            className="scroll-mt-36 sm:scroll-mt-40 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:p-10 shadow-xs focus:outline-none"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Context Summary */}
              <div className="lg:col-span-5">
                <span className="inline-block text-xs font-semibold tracking-wider uppercase text-accent">
                  Peluang Kerja Sama
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-ink leading-tight">
                  Kemitraan yang sedang dicari
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                  Buka peluang sinergi pasokan, ekspansi distribusi, pendampingan usaha, atau permodalan bersama pelaku usaha ini.
                </p>
              </div>

              {/* Partnership Tags & Specific Objective */}
              <div className="lg:col-span-7 space-y-5">
                {/* Partnership Category Tags */}
                {profile.seeking.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                      Bidang Kemitraan Terbuka
                    </h3>
                    <ul className="flex flex-wrap gap-2.5">
                      {profile.seeking.map((item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-soft-green px-3.5 py-2 text-xs sm:text-sm font-semibold text-forest shadow-2xs border border-forest/10"
                        >
                          <Handshake className="size-4 text-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specific Objective Callout Card */}
                {profile.seekingObjective && (
                  <div className="rounded-xl border border-line/70 bg-ivory/50 p-5 sm:p-6 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest mb-2">
                      <Target className="size-4 text-accent" />
                      <span>Rencana & Kebutuhan Spesifik</span>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed text-ink/85 whitespace-pre-wrap break-words">
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
      <footer
        className={cn(
          "mx-auto mt-14 sm:mt-20 text-center text-xs text-muted leading-relaxed",
          isModal ? "px-4" : "max-w-6xl px-4 sm:px-6 lg:px-8"
        )}
      >
        <p className="max-w-2xl mx-auto">
          Informasi profil dihimpun secara mandiri dari pemilik usaha terdaftar. LUMORA adalah platform digital pitching dan discovery UMKM Indonesia.
        </p>
      </footer>
    </article>
  );
}
