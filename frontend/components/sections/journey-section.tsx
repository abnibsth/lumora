import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { JourneyList, JourneyStep } from "@/components/ui/journey-line";
import { businesses } from "@/data/businesses";
import { journeySection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

/**
 * The business journey.
 *
 * This is where the journey-line motif does its actual job. Everywhere else it
 * is an echo; here the content genuinely is a sequence of stops in order, which
 * is why the motif was built instead of a decorative grid.
 *
 * The PRD's stated goal for this section is to make LUMORA feel human and
 * different from an ordinary financial directory, so the timeline is given the
 * space rather than squeezed beside other content, and the milestones are the
 * PRD's own for the demo business.
 *
 * The section is laid out in two columns so its rhythm differs from the centred
 * and full-width sections around it (R-05 rejects a uniform section rhythm).
 */
export function JourneySection() {
  const business = businesses[0];
  const milestones = business.milestones ?? [];

  return (
    <Section id={SECTION_IDS.journey}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div>
          <SectionHeading
            title={journeySection.heading}
            description={journeySection.description}
            className="max-w-xl"
          />

          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <Badge tone="demo">Contoh perjalanan</Badge>
            <span>{journeySection.note}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold text-ink">
            Perjalanan {business.name}
          </p>

          {milestones.length > 0 ? (
            <JourneyList className="mt-6">
              {milestones.map((milestone) => (
                <JourneyStep
                  key={milestone.year}
                  marker={String(milestone.year)}
                  title={milestone.title}
                />
              ))}
            </JourneyList>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
