import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { JourneyRule } from "@/components/ui/journey-line";
import { finalCta } from "@/data/landing";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

/**
 * The closing call to action, on the forest band.
 *
 * The PRD asked for a "subtle decorative grid/glow" here. A grid is the default
 * backdrop of every AI-generated landing page (R-07), and a glow is the kind of
 * effect R-13 caps at one focus accent. The journey line carries the same idea
 * the section is making, that a business is a story in progress, and it is
 * already the page's motif, so it frames the band instead.
 *
 * Colour, measured rather than judged: white on forest is 12.16:1 and mint on
 * forest is 8.25:1, both well clear of AA. The primary button uses the onDark
 * variant because --lumora-accent-strong would sit at 2.22:1 on this background
 * and stop reading as a button.
 */
export function FinalCtaSection() {
  return (
    <section className="bg-forest py-20 text-white md:py-28">
      <Container>
        <JourneyRule className="text-mint" />

        <div className="mt-10 flex flex-col items-center gap-6 text-center">
          <h2 className="text-section text-balance font-semibold">
            {finalCta.heading}
          </h2>

          <p className="text-lead max-w-2xl text-balance text-mint">
            {finalCta.description}
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href={ROUTES.registerUmkm}
              className={buttonStyles({ variant: "onDark", size: "lg" })}
            >
              Daftarkan UMKM
            </Link>
            <Link
              href={`#${SECTION_IDS.businesses}`}
              className={buttonStyles({ variant: "onDarkOutline", size: "lg" })}
            >
              Jelajahi Bisnis
            </Link>
          </div>
        </div>

        <JourneyRule className="mt-12 text-mint" />
      </Container>
    </section>
  );
}
