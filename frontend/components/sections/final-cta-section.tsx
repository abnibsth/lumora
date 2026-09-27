import { Reveal } from "@/components/ui/section";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { finalCta } from "@/data/landing";
import { ROUTES } from "@/lib/constants";

export function FinalCtaSection() {
  return (
    <section className="bg-forest py-24 text-white sm:py-32 lg:py-40">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <Reveal distance={20}>
            <h2 className="font-display text-[clamp(2.25rem,5vw,4.75rem)] leading-[1.08] font-medium tracking-[-0.035em] text-balance">
              {finalCta.heading}
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">{finalCta.description}</p>
          </Reveal>
          <Reveal delay={0.1} distance={16}>
            <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link href={ROUTES.registerUmkm} className={buttonStyles({ variant: "onDark", size: "lg", className: "w-full sm:w-auto" })}>Daftarkan UMKM</Link>
              <Link href={ROUTES.explore} className={buttonStyles({ variant: "onDarkOutline", size: "lg", className: "w-full sm:w-auto" })}>Jelajahi Bisnis</Link>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
