import { HeroSection } from "@/components/sections/hero-section";
import { ValueSection } from "@/components/sections/value-section";
import { BusinessDiscoverySection } from "@/components/sections/business-discovery-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { JourneySection } from "@/components/sections/journey-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { AiSection } from "@/components/sections/ai-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { Container } from "@/components/ui/container";
import { fetchBusinesses } from "@/lib/api";
import { getHomepagePublicContent } from "@/lib/homepage-storage";
import { SECTION_IDS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LUMORA | Cerita Bisnis, Peluang Nyata",
  description: "Kenali UMKM Indonesia melalui profil, cerita perjalanan usaha, dan model bisnis. Bangun profil usahamu dan temukan peluang kemitraan di LUMORA.",
};

export default async function Home() {
  const { content } = getHomepagePublicContent();

  let businesses: Awaited<ReturnType<typeof fetchBusinesses>>["items"] = [];
  let businessesError = false;

  try {
    businesses = (await fetchBusinesses({ limit: 6 })).items;
  } catch {
    businessesError = true;
  }

  return (
    <div className="lumora-home min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection businesses={businesses} content={content.hero} />

      {/* 2. Value Proposition */}
      {content.value.visible && <ValueSection content={content.value} />}

      {/* 3. Jelajahi UMKM */}
      {businessesError ? (
        <section id={SECTION_IDS.businesses} className="home-section home-discovery" aria-labelledby="home-discovery-title">
          <Container>
            <p className="home-eyebrow">{content.discovery.eyebrow}</p>
            <h2 id="home-discovery-title" className="home-heading mt-4">{content.discovery.heading}</h2>
            <p className="home-empty home-copy" role="status">
              Profil bisnis belum dapat dimuat saat ini. Silakan coba muat ulang beberapa saat lagi.
            </p>
          </Container>
        </section>
      ) : content.discovery.visible ? (
        <BusinessDiscoverySection businesses={businesses} content={content.discovery} />
      ) : null}

      {/* 4. Fitur LUMORA */}
      {content.features.visible && <FeaturesSection content={content.features} />}

      {/* 5. Cerita & Perjalanan Bisnis */}
      {content.journey.visible && (
        <JourneySection business={businesses[0]} content={content.journey} />
      )}

      {/* 6. Cara Kerja */}
      {content.howItWorks.visible && (
        <HowItWorksSection content={content.howItWorks} />
      )}

      {/* 7. Lumora AI */}
      {content.ai.visible && <AiSection content={content.ai} />}

      {/* 8. Final CTA */}
      {content.finalCta.visible && (
        <FinalCtaSection content={content.finalCta} />
      )}
    </div>
  );
}

