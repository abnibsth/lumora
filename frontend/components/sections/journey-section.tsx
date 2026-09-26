import { Container } from "@/components/ui/container";
import { businesses } from "@/data/businesses";
import { journeySection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

export function JourneySection() {
  const business = businesses[0];
  const milestones = business.milestones ?? [];

  return (
    <section id={SECTION_IDS.journey} className="bg-background py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Perjalanan bisnis</p>
            <h2 className="mt-4 font-display text-section font-medium text-balance text-ink">{journeySection.heading}</h2>
            <p className="mt-6 max-w-lg leading-8 text-muted">{journeySection.description}</p>
            <p className="mt-5 text-xs text-muted">{journeySection.note}</p>
          </div>

          <div>
            <p className="border-b border-line pb-5 text-sm font-semibold text-ink">Perjalanan {business.name}</p>
            <ol className="relative ml-3 border-l border-line-strong">
              {milestones.map((milestone, index) => (
                <li key={`${milestone.year}-${index}`} className="relative py-8 pl-8 sm:py-10 sm:pl-12">
                  <span className="absolute top-10 -left-[7px] h-3 w-3 rounded-full border-2 border-background bg-forest sm:top-12" />
                  <p className="font-display text-2xl text-accent sm:text-3xl">{milestone.year}</p>
                  <h3 className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{milestone.title}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-muted">{milestone.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
