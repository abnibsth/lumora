import { Container } from "@/components/ui/container";
import { problemItems, problemSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

export function ProblemSection() {
  return (
    <section id={SECTION_IDS.problem} className="bg-background py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              {problemSection.eyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-section font-medium text-balance text-ink">
              {problemSection.heading}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
              {problemSection.statement}
            </p>
          </div>

          <ol className="border-t border-line">
            {problemItems.map((item, index) => (
              <li key={item.title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-7 sm:grid-cols-[4rem_1fr] sm:py-9">
                <span className="font-display text-xl text-accent">0{index + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold text-ink sm:text-2xl">{item.title}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
