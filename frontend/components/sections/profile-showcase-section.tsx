import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { ProfileMockup } from "@/components/business/profile-mockup";
import { businesses } from "@/data/businesses";
import { profileShowcase } from "@/data/landing";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

export function ProfileShowcaseSection() {
  const business = businesses[0];

  return (
    <section id={SECTION_IDS.showcase} className="overflow-hidden bg-forest py-20 text-white sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-green uppercase">{profileShowcase.eyebrow}</p>
            <h2 className="mt-4 font-display text-section font-medium text-balance">{profileShowcase.heading}</h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-xl leading-8 text-white/75">{profileShowcase.description}</p>
            <Link href={ROUTES.business(business.slug)} className={`${buttonStyles({ variant: "onDarkOutline" })} mt-6`}>
              Lihat Profil Lengkap
            </Link>
          </div>
        </div>
        <ProfileMockup business={business} className="mt-12 border-white/15 shadow-[0_28px_90px_rgba(0,0,0,0.24)]" />
        <p className="mt-4 text-xs text-white/60">{profileShowcase.note}</p>
      </Container>
    </section>
  );
}
