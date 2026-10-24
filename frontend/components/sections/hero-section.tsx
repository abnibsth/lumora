import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/section";
import { ROUTES, SECTION_IDS } from "@/lib/constants";
import type { Business } from "@/types/business";
import type { HomepageContent } from "@/types/homepage";

function HeroBusiness({ business, secondary = false }: { business: Business; secondary?: boolean }) {
  return (
    <Link id={`home-hero-business-${business.slug}`} href={ROUTES.business(business.slug)} className={`home-live-business${secondary ? " home-live-business-secondary" : ""}`}>
      <div className="home-live-business-photo">
        {business.coverImage ? (
          <Image src={business.coverImage} alt="" fill sizes={secondary ? "240px" : "(max-width: 767px) 85vw, 360px"} className="object-cover" style={{ objectPosition: business.coverPosition }} />
        ) : (
          <span className="home-live-monogram" aria-hidden="true">{business.name.slice(0, 1)}</span>
        )}
      </div>
      <div className="home-live-business-copy">
        <p>{business.category} · {business.location}</p>
        <h2>{business.name}</h2>
        <span className="home-live-profile-link">Kenali usahanya <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  );
}

export function HeroSection({
  businesses = [],
  content,
}: {
  businesses?: Business[];
  content?: HomepageContent["hero"];
}) {
  const featured = businesses[0];
  const companion = businesses[1];
  const milestone = featured?.milestones?.at(-1);

  const wordmark = content?.wordmark || "LUMORA";
  const headingLead = content?.headingLead || "Tumbuh bersama";
  const headingEmphasis = content?.headingEmphasis || "UMKM Indonesia.";
  const description = content?.description || "Kenalkan cerita usahamu, tunjukkan perjalanannya, dan buka ruang untuk peluang kemitraan.";
  const primaryCta = content?.primaryCta || { label: "Mulai Sekarang", href: ROUTES.registerUmkm };
  const secondaryCta = content?.secondaryCta || { label: "Jelajahi UMKM", href: `#${SECTION_IDS.businesses}` };
  const footnote = content?.footnote || "Profil bisnis. Cerita pemilik. Peluang untuk terhubung.";
  const fallbackImage = content?.fallbackImage || {
    src: "/img/benner.png",
    alt: "Ilustrasi pelaku usaha di kedai kopi",
    caption: "Setiap usaha dimulai dari sebuah cerita.",
    disclosure: "Visual ilustrasi, bukan profil bisnis terdaftar.",
  };

  return (
    <section id={SECTION_IDS.hero} aria-labelledby="home-hero-title" className="home-hero home-live-hero">
      <div className="home-live-banner">
        <Container className="home-live-inner">
          <div className="home-live-layout">
            <div className="home-live-copy">
              <p className="home-live-wordmark">{wordmark}</p>
              <h1 id="home-hero-title">
                {headingLead}
                <br />
                <em>{headingEmphasis}</em>
              </h1>
              <p className="home-live-description">{description}</p>
              <div className="home-live-actions">
                <Link id="home-hero-start" href={primaryCta.href} className="home-button home-button-lime">
                  {primaryCta.label} <span aria-hidden="true">↗</span>
                </Link>
                <Link id="home-hero-discover" href={secondaryCta.href} className="home-link">
                  {secondaryCta.label} <span aria-hidden="true">↓</span>
                </Link>
              </div>
              <p className="home-live-footnote">{footnote}</p>
            </div>

            {/* Live business profiles replace the static supplied social banner. */}
            <Reveal onLoad distance={16} className="home-live-showcase">
              {featured ? (
                <>
                  <HeroBusiness business={featured} />
                  {companion ? <HeroBusiness business={companion} secondary /> : null}
                  <Link id="home-hero-journey" href={ROUTES.business(featured.slug)} className="home-live-journey">
                    <span className="home-live-journey-label">{milestone ? "Catatan perjalanan" : "Di balik usahanya"}</span>
                    {milestone ? <span className="home-live-year">{milestone.year}</span> : <span className="home-live-journey-name">{featured.name}</span>}
                    <span className="home-live-journey-title">{milestone?.title || "Kenali cerita dan model bisnisnya."}</span>
                    <span className="home-live-journey-arrow" aria-hidden="true">↗</span>
                  </Link>
                </>
              ) : (
                <figure className="home-live-fallback">
                  <div className="home-live-fallback-photo">
                    <Image
                      src={fallbackImage.src || "/img/benner.png"}
                      alt={fallbackImage.alt || "Ilustrasi pelaku usaha di kedai kopi"}
                      fill
                      sizes="(max-width: 767px) 90vw, 520px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption>
                    {fallbackImage.caption || "Setiap usaha dimulai dari sebuah cerita."}
                    <span>{fallbackImage.disclosure || "Visual ilustrasi, bukan profil bisnis terdaftar."}</span>
                  </figcaption>
                </figure>
              )}
            </Reveal>
          </div>
        </Container>

        <svg className="home-live-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 32C180 4 330 4 520 32S850 66 1050 34S1300 10 1440 24V70H0Z" /></svg>
      </div>
    </section>
  );
}

