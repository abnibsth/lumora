import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProfileMockup } from "@/components/business/profile-mockup";
import { businesses } from "@/data/businesses";
import { profileShowcase } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

/**
 * The profile showcase.
 *
 * The section's claim is that one profile holds the whole story, so the mockup
 * shows the breadth of that structure rather than describing it: header, about,
 * metrics, journey, canvas, and what the owner is looking for. A shorter mockup
 * would undercut the heading.
 *
 * The mockup shows the demo business, so the section carries a visible example
 * label above it. No founder or team appears, because there is no real person to
 * name (R-18).
 */
export function ProfileShowcaseSection() {
  return (
    <Section id={SECTION_IDS.showcase}>
      <SectionHeading
        eyebrow={profileShowcase.eyebrow}
        title={profileShowcase.heading}
        description={profileShowcase.description}
        className="max-w-2xl"
      />

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Badge tone="demo">Contoh profil</Badge>
        <span>{profileShowcase.note}</span>
      </p>

      <ProfileMockup business={businesses[0]} className="mt-10" />
    </Section>
  );
}
