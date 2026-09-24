import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { ProfilePreview } from "@/components/business/profile-preview";
import { ProblemSection } from "@/components/sections/problem-section";
import { BusinessDiscoverySection } from "@/components/sections/business-discovery-section";
import { ValueSection } from "@/components/sections/value-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { AiSection } from "@/components/sections/ai-section";
import { ProfileShowcaseSection } from "@/components/sections/profile-showcase-section";
import { JourneySection } from "@/components/sections/journey-section";
import { PersonaSection } from "@/components/sections/persona-section";
import { AboutSection } from "@/components/sections/about-section";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { businesses } from "@/data/businesses";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

/**
 * The landing page, in the order PRD 10 lays out.
 *
 * Every section the PRD specifies is built, and every navigation anchor resolves
 * to one of them, so there is no placeholder left on the page. The hero is the
 * only section that does not use the shared Section shell: it has its own
 * padding and carries the page's single h1.
 *
 * The hero's product mockup shows the PRD's own example business under a visible
 * "Contoh profil" label. Every other section that shows demo data carries its own
 * label, so no figure on this page is presented as a real business's.
 */

const heroBusiness = businesses[0];

export default function Home() {
  return (
    <>
      <section id={SECTION_IDS.hero} className="pt-12 pb-16 md:pt-20 md:pb-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <div className="flex max-w-2xl flex-col gap-6">
              <p className="text-sm font-medium text-accent">
                Platform Digital Pitching untuk UMKM
              </p>

              <h1 className="text-hero text-balance font-semibold text-ink">
                Bisnis Kecil Juga Layak untuk Dilihat.
              </h1>

              <p className="text-lead text-muted">
                LUMORA membantu UMKM mempresentasikan bisnisnya secara
                profesional, membangun profil dengan bantuan AI, dan terhubung
                dengan calon pemodal serta mitra bisnis yang tepat.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={ROUTES.registerUmkm}
                  className={buttonStyles({ variant: "accent", size: "lg" })}
                >
                  Daftarkan UMKM
                </Link>
                <Link
                  href={`#${SECTION_IDS.businesses}`}
                  className={buttonStyles({ variant: "secondary", size: "lg" })}
                >
                  Jelajahi Bisnis
                </Link>
              </div>

              {/* One quiet line rather than three chips. A row of pill badges
                  is the shape R-09 rejects, and it would put three more
                  rectangles in a hero that already carries two panels. */}
              <p className="pt-2 text-sm text-muted">
                Proses mudah &middot; Dibantu AI &middot; Gratis untuk memulai
              </p>
            </div>

            <ProfilePreview business={heroBusiness} />
          </div>
        </Container>
      </section>

      <ProblemSection />
      <BusinessDiscoverySection />
      <ValueSection />
      <HowItWorksSection />
      <AiSection />
      <ProfileShowcaseSection />
      <JourneySection />
      <PersonaSection />
      <AboutSection />
      <FaqSection />

      <FinalCtaSection />
    </>
  );
}
