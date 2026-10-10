import { Reveal } from "@/components/ui/section";
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

const ecosystemItems = [
  { label: "UMKM Lokal", path: "M3 10h18M5 10v11h14V10M3 10l2-7h14l2 7M9 21v-7h6v7" },
  { label: "Bisnis Kreatif", path: "m12 3 9 9-9 9-9-9 9-9ZM12 3v18M3 12h18" },
  { label: "Kuliner", path: "M5 3v7m4-7v7M5 7h4M7 10v11M17 3v18M17 3c-4 3-4 9 0 9" },
  { label: "Fashion", path: "m8 3-5 4 3 5 2-1v10h8V11l2 1 3-5-5-4c0 4-8 4-8 0Z" },
  { label: "Mitra Usaha", path: "m3 9 5-4 4 2 4-2 5 4-3 8-4 3-4-2-4-1-3-8ZM8 5l-2 8 4 5m2-11-4 5 3 2 4-4 5 5" },
  { label: "Lumora AI", path: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" },
];

function EcosystemMarquee() {
  return (
    <section aria-label="Ekosistem LUMORA" className="lumora-marquee">
      <div className="lumora-marquee-window">
        <div className="lumora-marquee-track">
          {[false, true].map((duplicate) => (
            <ul key={String(duplicate)} aria-hidden={duplicate || undefined} className="lumora-marquee-group">
              {ecosystemItems.map((item) => (
                <li key={item.label} className="lumora-marquee-item">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={item.path} /></svg>
                  <span>{item.label}</span>
                  <span aria-hidden="true" className="ml-5 h-1 w-1 rounded-full bg-lime" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <section
        id={SECTION_IDS.hero}
        className="relative isolate overflow-hidden bg-forest text-white sm:min-h-[38rem] lg:min-h-[clamp(480px,calc(100svh-180px),760px)]"
      >
        <Reveal onLoad distance={0} scale={1.015} className="relative mt-[29rem] h-[18rem] w-full sm:absolute sm:inset-y-0 sm:right-0 sm:mt-0 sm:h-auto sm:w-[76%] lg:w-[68%]">
          <Image
            src="/img/benner.png"
            alt="Pelaku UMKM di tempat usahanya"
            fill
            priority
            sizes="(min-width: 1024px) 68vw, (min-width: 640px) 76vw, 100vw"
            className="object-cover object-[66%_center] sm:object-[66%_center] lg:object-[65%_center]"
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,#0F3D2E_0%,rgba(15,61,46,0.35)_22%,transparent_55%)] sm:bg-[linear-gradient(90deg,#0F3D2E_0%,rgba(15,61,46,0.9)_15%,rgba(15,61,46,0.48)_32%,rgba(15,61,46,0.12)_52%,transparent_72%)]" />
        </Reveal>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,61,46,0)_52%,rgba(15,61,46,0.24)_100%)] sm:bg-[linear-gradient(90deg,#0F3D2E_0%,#0F3D2E_30%,rgba(15,61,46,0.86)_42%,rgba(15,61,46,0.3)_57%,transparent_74%)]" />

        <Container className="absolute inset-x-0 top-0 z-10 flex min-h-[29rem] items-start py-12 sm:relative sm:min-h-[38rem] sm:items-center sm:py-16 lg:max-w-[1536px] lg:min-h-[clamp(480px,calc(100svh-180px),760px)]">
          <div className="w-full max-w-lg sm:w-[42%] sm:max-w-none lg:w-[40%]">
            <Reveal onLoad delay={0.12}>
            <h1 className="font-display text-[clamp(2.625rem,12vw,3.625rem)] leading-[0.98] font-medium tracking-[-0.04em] text-balance sm:text-[clamp(3rem,6vw,5rem)] sm:leading-[1.02]">
              Bisnis nyata,
              <br />
              solusi nyata.
            </h1>
            </Reveal>
            <Reveal onLoad delay={0.22}>
            <p className="mt-5 max-w-md text-lg leading-8 text-white sm:text-xl">
              Temukan UMKM, pahami perjalanan usahanya, dan buka peluang untuk
              tumbuh bersama.
            </p>
            </Reveal>
            <Reveal onLoad delay={0.32} className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row">
              <Link
                href={`#${SECTION_IDS.businesses}`}
                className={buttonStyles({ variant: "onDark", size: "lg", className: "w-full sm:w-auto" })}
              >
                Temukan UMKM
              </Link>
              <Link
                href={ROUTES.registerUmkm}
                className={buttonStyles({ variant: "onDarkOutline", size: "lg", className: "w-full sm:w-auto" })}
              >
                Ceritakan Bisnismu
              </Link>
            </Reveal>
          </div>
        </Container>
      </section>

      <EcosystemMarquee />

      <section id="lumora-launch-video" aria-label="Video pengenalan LUMORA" className="w-full overflow-hidden bg-forest-deep">
        <video
          id="lumora-launch-player"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Video pengenalan LUMORA"
          className="block aspect-video w-full object-cover"
        >
          <source src="/vid/LumoraLaunch.mp4" type="video/mp4" />
          Browser Anda tidak mendukung video. <a href="/vid/LumoraLaunch.mp4">Unduh video LUMORA</a>.
        </video>
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
