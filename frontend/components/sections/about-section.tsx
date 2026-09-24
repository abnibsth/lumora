import { Badge } from "@/components/ui/badge";
import { BulletList } from "@/components/ui/bullet-list";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { aboutSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";
import { BUSINESS_CATEGORIES } from "@/types/business";

/**
 * What LUMORA is, what it is not, and who it is for.
 *
 * The "is not" list is the most valuable content in this section, and it comes
 * straight from PRD 3 and PRD 5. A platform that says plainly it is not a
 * crowdfunding service, not an escrow, and not an investment adviser is easier to
 * believe about what it does claim. Removing the list would make the section
 * shorter and weaker.
 *
 * Social proof takes PRD 10.11's Option A: state who the product is built for and
 * show the real category list. Option B, a demo testimonial, is refused. A
 * labelled fake review is still a fabricated quote (R-18, R-38), and the PRD
 * itself says a production build must replace it with real testimonials.
 */
export function AboutSection() {
  return (
    <Section id={SECTION_IDS.about}>
      <SectionHeading title={aboutSection.heading} className="max-w-3xl" />

      <p className="text-lead mt-6 max-w-3xl text-muted">
        {aboutSection.statement}
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h3 className="text-card-title font-semibold text-ink">
            {aboutSection.isTitle}
          </h3>
          <BulletList items={aboutSection.isItems} className="mt-4 gap-3" />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h3 className="text-card-title font-semibold text-ink">
            {aboutSection.isNotTitle}
          </h3>
          <BulletList
            items={aboutSection.isNotItems}
            tone="neutral"
            className="mt-4 gap-3"
          />
        </div>
      </div>

      <div className="mt-12 border-t border-line pt-8">
        <h3 className="text-card-title font-semibold text-ink">
          {aboutSection.socialProof.title}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {aboutSection.socialProof.body}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {BUSINESS_CATEGORIES.map((category) => (
            <li key={category}>
              <Badge tone="mint">{category}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
