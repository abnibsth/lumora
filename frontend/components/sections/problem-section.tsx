import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { problemItems, problemSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

/**
 * The problem section.
 *
 * The PRD put an `86,74%` figure at the centre of this section with a note to
 * add a clear source label. No source exists, so the number is gone rather than
 * dressed with a citation it does not have (R-17). The section still makes the
 * same argument, using a statement that claims nothing measurable: the obstacle
 * is scattered records and missing documentation, not the quality of the
 * business.
 *
 * The three cards carry no shadow and no hover state. They are not interactive,
 * so giving them a lift would signal a click target that is not there (R-26),
 * and it would spend the elevation the business cards need to mean something.
 */
export function ProblemSection() {
  return (
    <Section id={SECTION_IDS.problem}>
      <SectionHeading
        eyebrow={problemSection.eyebrow}
        title={problemSection.heading}
        className="max-w-3xl"
      />

      <p className="mt-6 max-w-3xl text-lead text-muted">
        {problemSection.statement}
      </p>

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {problemItems.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <h3 className="text-card-title font-semibold text-ink">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
