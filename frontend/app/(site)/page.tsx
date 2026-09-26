import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { ProblemSection } from "@/components/sections/problem-section";
import { BusinessDiscoverySection } from "@/components/sections/business-discovery-section";
import { ValueSection } from "@/components/sections/value-section";
import { AiSection } from "@/components/sections/ai-section";
import { ProfileShowcaseSection } from "@/components/sections/profile-showcase-section";
import { JourneySection } from "@/components/sections/journey-section";
import { PersonaSection } from "@/components/sections/persona-section";
import { AboutSection } from "@/components/sections/about-section";
import { FaqSection } from "@/components/sections/faq-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

export default function Home() {
  return (
    <>
      <section
        id={SECTION_IDS.hero}
        className="relative isolate min-h-[36rem] overflow-hidden bg-[#0F3D2E] text-white lg:min-h-[35rem]"
      >
        <div className="absolute inset-x-0 bottom-0 h-[64%] sm:inset-y-0 sm:right-0 sm:left-auto sm:h-auto sm:w-[76%] lg:w-[68%]">
          <Image
            src="/img/benner.png"
            alt="Pelaku UMKM di tempat usahanya"
            fill
            priority
            sizes="(min-width: 1024px) 68vw, (min-width: 640px) 76vw, 100vw"
            className="hero-image-enter object-cover object-[64%_center] sm:object-[66%_center] lg:object-[65%_center]"
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,#0F3D2E_0%,rgba(15,61,46,0.92)_20%,rgba(15,61,46,0.3)_52%,rgba(15,61,46,0.08)_100%)] sm:bg-[linear-gradient(90deg,#0F3D2E_0%,rgba(15,61,46,0.9)_15%,rgba(15,61,46,0.48)_32%,rgba(15,61,46,0.12)_52%,transparent_72%)]" />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,61,46,0)_52%,rgba(15,61,46,0.24)_100%)] sm:bg-[linear-gradient(90deg,#0F3D2E_0%,#0F3D2E_30%,rgba(15,61,46,0.86)_42%,rgba(15,61,46,0.3)_57%,transparent_74%)]" />

        <Container className="relative z-10 flex min-h-[36rem] items-start py-12 sm:min-h-[38rem] sm:items-center sm:py-16 lg:min-h-[35rem]">
          <div className="w-full max-w-md sm:w-[42%] sm:max-w-none lg:w-[40%]">
            <h1 className="hero-enter hero-enter-title font-display text-[clamp(2.8rem,5.8vw,5rem)] leading-[1.02] font-medium tracking-[-0.04em] text-balance">
              Bisnis nyata,
              <br />
              solusi nyata.
            </h1>
            <p className="hero-enter hero-enter-copy mt-5 max-w-md text-lg leading-8 text-white sm:text-xl">
              Temukan UMKM, pahami perjalanan usahanya, dan buka peluang untuk
              tumbuh bersama.
            </p>
            <div className="hero-enter hero-enter-actions mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`#${SECTION_IDS.businesses}`}
                className={buttonStyles({ variant: "onDark", size: "lg" })}
              >
                Temukan UMKM
              </Link>
              <Link
                href={ROUTES.registerUmkm}
                className={buttonStyles({ variant: "onDarkOutline", size: "lg" })}
              >
                Ceritakan Bisnismu
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section aria-label="Peran LUMORA" className="border-b border-line bg-[#e7efea]">
        <Container>
          <ul className="grid gap-px py-4 text-sm text-forest sm:grid-cols-3 sm:text-center">
            <li className="py-2">Profil usaha yang lebih mudah dipahami</li>
            <li className="py-2">Cerita dan perjalanan bisnis dalam satu tempat</li>
            <li className="py-2">Ruang temu bagi UMKM dan calon mitra</li>
          </ul>
        </Container>
      </section>

      <ProblemSection />
      <BusinessDiscoverySection />
      <ValueSection />
      <AiSection />
      <ProfileShowcaseSection />
      <PersonaSection />
      <JourneySection />
      <AboutSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
