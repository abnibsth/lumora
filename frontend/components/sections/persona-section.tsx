import Link from "next/link";
import { BulletList } from "@/components/ui/bullet-list";
import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { personaCards, personaSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The dual persona section: one card per audience, with its own call to action.
 *
 * Hierarchy comes from two things rather than from a second dark block: the UMKM
 * card carries a forest border and the filled accent button, the investor card
 * carries the softer border and the outlined button. The page keeps a single dark
 * moment at the final call to action, and repeating that here would spend it.
 *
 * The card order is deliberate. UMKM is the supply side of the marketplace, so
 * the section leads with it; without businesses there is nothing for an investor
 * to discover.
 */
export function PersonaSection() {
  return (
    <Section id={SECTION_IDS.persona}>
      <SectionHeading
        align="center"
        title={personaSection.heading}
        description={personaSection.description}
        className="mx-auto max-w-2xl"
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {personaCards.map((card) => {
          const primary = card.key === "umkm";

          return (
            <div
              key={card.key}
              className={cn(
                "flex flex-col rounded-2xl border bg-surface p-6 sm:p-8",
                primary ? "border-forest" : "border-line",
              )}
            >
              <p className="text-sm font-medium text-accent">{card.audience}</p>
              <h3 className="mt-2 text-2xl font-semibold text-balance text-ink sm:text-3xl">
                {card.heading}
              </h3>

              <BulletList items={card.benefits} className="mt-6 gap-3" />

              <div className="mt-auto pt-8">
                <Link
                  href={card.ctaHref}
                  className={buttonStyles({
                    variant: primary ? "accent" : "secondary",
                    size: "lg",
                  })}
                >
                  {card.ctaLabel}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
