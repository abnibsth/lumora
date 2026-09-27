"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { businesses } from "@/data/businesses";
import { discoverySection } from "@/data/landing";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

const featuredSlugs = ["kopi-ruang-senja", "arunika-bakery", "nara-studio"];
const filters = ["Semua", "F&B", "Retail", "Jasa", "Kreatif", "Fashion"] as const;

export function BusinessDiscoverySection() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Semua");
  const selected = useMemo(
    () => businesses.filter((business) =>
      featuredSlugs.includes(business.slug) &&
      (filter === "Semua" || business.category === filter)),
    [filter],
  );

  return (
    <section id={SECTION_IDS.businesses} className="bg-surface py-20 sm:py-24 lg:py-32">
      <Container>
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                {discoverySection.eyebrow}
              </p>
              <h2 className="mt-4 max-w-3xl font-display text-section font-medium text-balance text-ink">
                {discoverySection.heading}
              </h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-muted lg:justify-self-end">
              {discoverySection.description} Seluruh profil pada bagian ini merupakan data contoh.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter kategori bisnis">
            {filters.map((item) => (
              <button
                id={`home-filter-${item.toLowerCase().replaceAll("&", "and").replaceAll(" ", "-")}`}
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`min-h-11 rounded-full px-5 text-sm font-medium transition-colors ${filter === item ? "bg-forest text-white" : "border border-line bg-transparent text-ink hover:border-forest"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </Reveal>

        {selected.length ? (
          <StaggerContainer className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.85fr] lg:grid-rows-2">
            {selected.map((business, index) => (
              <StaggerItem key={business.slug} className={index === 0 && selected.length > 1 ? "sm:col-span-2 lg:row-span-2" : ""}>
                <Link
                  href={ROUTES.business(business.slug)}
                  className={`group relative isolate block aspect-[4/3] min-h-0 overflow-hidden rounded-2xl bg-forest text-white sm:aspect-[3/2] ${index === 0 && selected.length > 1 ? "lg:aspect-auto lg:min-h-[39rem]" : ""}`}
                >
                  <Image
                    src={business.coverImage ?? "/img/benner.png"}
                    alt=""
                    fill
                    sizes={index === 0 ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 34vw, 100vw"}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                    style={{ objectPosition: business.coverPosition }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <p className="text-xs font-semibold tracking-[0.16em] text-mint uppercase">{business.category} · {business.location}</p>
                    <h3 className={`mt-2 font-display font-medium ${index === 0 ? "text-3xl sm:text-5xl" : "text-2xl"}`}>{business.name}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/80 sm:text-base">{business.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Lihat profil <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <p className="mt-8 border-y border-line py-12 text-muted">Belum ada profil contoh pada kategori ini.</p>
        )}

        <div className="mt-10">
          <Link href={ROUTES.explore} className={buttonStyles({ variant: "secondary" })}>
            Jelajahi Semua Bisnis
          </Link>
        </div>
      </Container>
    </section>
  );
}
