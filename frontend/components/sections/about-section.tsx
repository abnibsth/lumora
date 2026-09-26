import { Container } from "@/components/ui/container";
import { aboutSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

export function AboutSection() {
  return (
    <section id={SECTION_IDS.about} className="bg-[#e7efea] py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <h2 className="max-w-2xl font-display text-section font-medium text-balance text-ink">{aboutSection.heading}</h2>
          <p className="max-w-2xl text-base leading-8 text-muted lg:pt-2">{aboutSection.statement}</p>
        </div>

        <div className="mt-14 grid border-t border-line-strong lg:grid-cols-2">
          <div className="py-9 lg:pr-12">
            <h3 className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">{aboutSection.isTitle}</h3>
            <ul className="mt-6 divide-y divide-line">
              {aboutSection.isItems.map((item, index) => (
                <li key={item} className="grid grid-cols-[2rem_1fr] gap-3 py-4 text-base leading-7 text-ink"><span className="text-accent">0{index + 1}</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border-t border-line-strong py-9 lg:border-t-0 lg:border-l lg:pl-12">
            <h3 className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">{aboutSection.isNotTitle}</h3>
            <ul className="mt-6 divide-y divide-line">
              {aboutSection.isNotItems.map((item) => (
                <li key={item} className="flex gap-3 py-4 text-base leading-7 text-muted"><span aria-hidden="true">—</span>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
