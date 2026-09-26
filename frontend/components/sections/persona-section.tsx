import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { personaCards, personaSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

export function PersonaSection() {
  return (
    <section id={SECTION_IDS.persona} className="bg-surface py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Untuk siapa</p>
          <div>
            <h2 className="font-display text-section font-medium text-balance text-ink">{personaSection.heading}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted">{personaSection.description}</p>
          </div>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-2xl lg:grid-cols-2">
          {personaCards.map((card) => {
            const primary = card.key === "umkm";
            return (
              <article
                id={primary ? SECTION_IDS.forUmkm : SECTION_IDS.forPartners}
                key={card.key}
                className={`scroll-mt-24 flex min-h-[31rem] flex-col p-7 sm:p-10 lg:p-12 ${primary ? "bg-[#e7efea] text-ink" : "bg-forest text-white"}`}
              >
                <p className={`text-xs font-semibold tracking-[0.16em] uppercase ${primary ? "text-accent" : "text-green"}`}>{card.audience}</p>
                <h3 className="mt-4 max-w-md font-display text-3xl font-medium text-balance sm:text-4xl">{card.heading}</h3>
                <ul className={`mt-8 space-y-4 border-t pt-6 ${primary ? "border-line" : "border-white/20"}`}>
                  {card.benefits.map((benefit) => <li key={benefit} className="flex gap-3 text-sm leading-6"><span aria-hidden="true">—</span>{benefit}</li>)}
                </ul>
                <div className="mt-auto pt-10">
                  <Link href={card.ctaHref} className={buttonStyles({ variant: primary ? "primary" : "onDark", size: "lg" })}>{card.ctaLabel}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
