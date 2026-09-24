import { Accordion } from "@/components/ui/accordion";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqItems } from "@/data/faq";
import { faqSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

/**
 * The FAQ.
 *
 * Every question here is specific to this product: whether LUMORA is a
 * crowdfunding platform, whether a legal entity is required, and what the AI
 * does and does not decide. R-28 rejects a FAQ that exists to fill a template, so
 * there are no generic "How do I get started" entries, and each answer commits to
 * something a reader could hold the product to.
 */
export function FaqSection() {
  return (
    <Section id={SECTION_IDS.faq}>
      <SectionHeading
        align="center"
        title={faqSection.heading}
        description={faqSection.description}
        className="mx-auto max-w-2xl"
      />

      <Accordion className="mx-auto mt-10 max-w-3xl" items={faqItems} />
    </Section>
  );
}
