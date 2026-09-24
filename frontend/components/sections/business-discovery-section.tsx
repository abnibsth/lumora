import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { BusinessDiscoveryExplorer } from "@/components/business/business-discovery-explorer";
import { discoverySection } from "@/data/landing";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

/**
 * The discovery preview, which the PRD calls the most important section on the
 * page.
 *
 * The businesses shown are demo data. The disclosure sits directly under the
 * heading, above the filters, so it is read before any figure is: a labelled
 * placeholder is allowed, an unlabelled one is a fabricated business (R-38).
 *
 * The heading, the disclosure, and the closing link stay server-rendered; only
 * the filter and the save toggles cross into a client component.
 */
export function BusinessDiscoverySection() {
  return (
    <Section id={SECTION_IDS.businesses}>
      <SectionHeading
        eyebrow={discoverySection.eyebrow}
        title={discoverySection.heading}
        description={discoverySection.description}
        className="max-w-2xl"
      />

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Badge tone="demo">Contoh profil</Badge>
        <span>{discoverySection.demoNote}</span>
      </p>

      <BusinessDiscoveryExplorer />

      <div className="mt-10">
        <Link
          href={ROUTES.explore}
          className={buttonStyles({ variant: "secondary" })}
        >
          Jelajahi Semua Bisnis
        </Link>
      </div>
    </Section>
  );
}
