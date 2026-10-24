"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { discoverySection } from "@/data/landing";
import { ROUTES, SECTION_IDS } from "@/lib/constants";
import type { Business } from "@/types/business";
import type { HomepageContent } from "@/types/homepage";

const filters = ["Semua", "F&B", "Retail", "Jasa", "Kreatif", "Fashion"] as const;

export function BusinessDiscoverySection({
  businesses,
  content,
}: {
  businesses: Business[];
  content?: HomepageContent["discovery"];
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Semua");

  const selected = useMemo(() => {
    return businesses.filter(
      (business) => filter === "Semua" || business.category === filter,
    );
  }, [businesses, filter]);

  if (content && !content.visible) {
    return null;
  }

  const eyebrow = content?.eyebrow || discoverySection.eyebrow;
  const heading = content?.heading || discoverySection.heading;
  const description = content?.description || discoverySection.description;
  const cta = content?.cta || { label: "Jelajahi Semua Bisnis", href: ROUTES.explore };

  return (
    <section id={SECTION_IDS.businesses} className="home-section home-discovery" aria-labelledby="home-discovery-title">
      <Container>
        <Reveal>
          <div className="home-section-top">
            <div>
              <p className="home-eyebrow">{eyebrow}</p>
              <h2 id="home-discovery-title" className="home-heading">{heading}</h2>
            </div>
            <p className="home-copy">{description}</p>
          </div>
        </Reveal>


        <Reveal delay={0.08}>
          <div className="home-filters" role="group" aria-label="Filter kategori bisnis">
            {filters.map((item) => (
              <button
                id={`home-filter-${item.toLowerCase().replaceAll("&", "and").replaceAll(" ", "-")}`}
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className="home-filter"
              >
                {item}
              </button>
            ))}
          </div>
        </Reveal>

        {selected.length ? (
          <StaggerContainer className="home-business-grid">
            {selected.map((business) => (
              <StaggerItem key={business.slug}>
                <Link
                  id={`home-business-${business.slug}`}
                  href={ROUTES.business(business.slug)}
                  className="home-business"
                >
                  <div className="home-business-image">
                    {business.coverImage ? (
                      <Image
                        src={business.coverImage}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 480px) 50vw, 100vw"
                        style={{ objectPosition: business.coverPosition }}
                      />
                    ) : (
                      <span className="home-business-monogram" aria-hidden="true">{business.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <p className="home-business-meta">{business.category} · {business.location}</p>
                    <h3>{business.name}</h3>
                    <p className="home-business-description">{business.description}</p>
                    <span className="home-link mt-2">Lihat profil <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <p className="home-empty home-copy" role="status">Belum ada profil bisnis pada kategori ini.</p>
        )}

        <div className="mt-8">
          <Link id="home-discovery-explore" href={cta.href} className="home-link">
            {cta.label}
          </Link>
        </div>
      </Container>
    </section>
  );
}

