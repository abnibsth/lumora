import { Reveal, ScrollTimeline } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { journeySection } from "@/data/landing";
import { SECTION_IDS, ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";
import type { HomepageContent } from "@/types/homepage";
import Link from "next/link";
import Image from "next/image";

export function JourneySection({
  business,
  content,
}: {
  business?: Business;
  content?: HomepageContent["journey"];
}) {
  const milestones = business?.milestones ?? [];
  const businessName = business?.name;

  if (content && !content.visible) {
    return null;
  }

  const eyebrow = content?.eyebrow || "Cerita & Perjalanan Usaha";
  const headingLead = content?.headingLead || "Kenali proses di balik";
  const headingEmphasis = content?.headingEmphasis || "usahanya.";
  const description = content?.description || journeySection.description;

  return (
    <section
      id={SECTION_IDS.journey}
      className="home-section"
    >
      <Container>
        <div id={SECTION_IDS.showcase} className="home-story-layout">
          <Reveal distance={16}>
            <span className="home-eyebrow">
              {eyebrow}
            </span>
            <h2 className="home-heading mt-4">
              {headingLead} <em>{headingEmphasis}</em>
            </h2>
            <p className="home-copy mt-5">
              {description}
            </p>


            {business ? (
              <div className="mt-7">
                {business.coverImage ? (
                  <div className="home-story-business">
                    <Image
                      src={business.coverImage}
                      alt={`Usaha ${business.name}`}
                      fill
                      sizes="(min-width: 1024px) 42vw, 90vw"
                      style={{ objectPosition: business.coverPosition }}
                    />
                  </div>
                ) : null}
                <div className="home-story-caption">
                  <p className="home-eyebrow">{business.category} · {business.location}</p>
                  <h3 className="mt-2">{business.name}</h3>
                  <p className="home-copy home-story-text">{business.story || business.description}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-8">
              <Link
                href={business ? ROUTES.business(business.slug) : ROUTES.explore}
                id="home-story-profile"
                className="home-link"
              >
                <span>{business ? `Baca profil ${business.name}` : "Jelajahi profil usaha"}</span>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <div className="border-b border-line pb-4">
                <h3 className="text-base font-medium text-ink">
                  {businessName ? `Perjalanan ${businessName}` : "Catatan perjalanan usaha"}
                </h3>
              </div>

              {!milestones.length ? (
                <div className="home-story-empty mt-6">
                  <p className="home-copy">{business ? "Pemilik usaha belum menambahkan tonggak perjalanan bisnisnya." : "Belum ada cerita usaha yang dapat ditampilkan saat ini."}</p>
                  <p className="home-copy mt-3">Pemilik UMKM dapat mencatat tahun dan cerita perkembangan usahanya melalui profil LUMORA.</p>
                  <Link id="home-story-create" href={ROUTES.registerUmkm} className="home-link mt-5 self-start">Ceritakan usahamu</Link>
                </div>
              ) : null}
              {milestones.length > 0 ? <ScrollTimeline className="relative ml-2 sm:ml-4 mt-6 border-l border-line-strong/60">
                {milestones.map((milestone, index) => (
                  <div
                    key={`${milestone.year}-${index}`}
                    className="relative py-6 pl-8 sm:py-8 sm:pl-10"
                  >
                    {/* Organic timeline node */}
                    <span
                      aria-hidden="true"
                      className="absolute top-8 sm:top-10 -left-[7px] h-3.5 w-3.5 rounded-full border-2 border-surface bg-forest shadow-xs"
                    />
                    <span className="font-serif italic text-2xl sm:text-3xl font-semibold text-accent">
                      {milestone.year}
                    </span>
                    <h3 className="mt-2 text-lg sm:text-xl font-semibold text-ink tracking-tight">
                      {milestone.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted max-w-lg">
                      {milestone.description}
                    </p>
                  </div>
                ))}
              </ScrollTimeline> : null}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
