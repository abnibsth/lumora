import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { JourneyNode } from "@/components/ui/journey-line";
import { valueItems, valueSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

/**
 * The value proposition.
 *
 * These three are a sequence (tell it, shape it, be found), so each card opens
 * with the motif's square node and its step number. The node is imported rather
 * than redrawn so the shape cannot drift from the one the journey line uses.
 *
 * No shadow and no hover: the cards are not clickable, and elevation on this
 * page is reserved for cards that lead somewhere.
 */
export function ValueSection() {
  return (
    <Section id={SECTION_IDS.value}>
      <SectionHeading title={valueSection.heading} className="max-w-3xl" />

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {valueItems.map((item) => (
          <li
            key={item.marker}
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <div className="flex items-center gap-2">
              <JourneyNode />
              <span className="text-xs font-semibold tracking-wide text-accent">
                {item.marker}
              </span>
            </div>
            <h3 className="mt-3 text-card-title font-semibold text-ink">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
