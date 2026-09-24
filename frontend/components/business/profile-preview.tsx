import { Badge } from "@/components/ui/badge";
import { BusinessMonogram } from "@/components/business/business-monogram";
import { RevenueChart } from "@/components/business/revenue-chart";
import { businessAge } from "@/lib/business";
import type { Business } from "@/types/business";

/**
 * The hero's layered product mockup: a business profile panel with an AI summary
 * card sitting over its lower edge.
 *
 * Two honesty constraints shape this component, and both are deliberate:
 *
 * 1. It shows a demo business, so the panel carries a visible "Contoh profil"
 *    label and the caption underneath states plainly that the figures are an
 *    illustration. PRD 15 allows demo data; R-38 requires it never be passed off
 *    as real. Without both labels this becomes a fabricated business profile.
 * 2. It does not show a "Terverifikasi" badge. PRD 24 forbids implying legal
 *    verification, and no verification process exists yet, so the business type
 *    keeps its `verified` field unused until one ships.
 *
 * The AI summary is derived from the same fields the panel renders, so editing
 * the demo data cannot leave the summary describing numbers that are no longer
 * on screen.
 *
 * Layering: the AI card is pulled up 24px into the panel's bottom padding and
 * inset from the left at sm and up. The panel reserves that space with a larger
 * bottom padding, so the overlap never covers content. Nothing here floats or
 * loops; the two cards take a single staggered entrance that ends and stops.
 */

function buildSummary(business: Business): string {
  const parts = [`${business.description} Berlokasi di ${business.location}.`];

  const series = business.revenueSeries;
  if (series && series.length > 1) {
    const first = series[0];
    const last = series[series.length - 1];
    parts.push(
      `Pendapatan contoh tercatat bergerak dari Rp${first.toFixed(1)} juta menjadi Rp${last.toFixed(1)} juta dalam ${series.length} bulan.`,
    );
  }

  if (business.seeking?.length) {
    parts.push(
      `Pemilik menyebut sedang mencari ${business.seeking.join(" dan ").toLowerCase()}.`,
    );
  }

  return parts.join(" ");
}

export function ProfilePreview({
  business,
  className,
}: {
  business: Business;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="rise-in rounded-2xl border border-line bg-surface p-5 pb-12 shadow-panel sm:p-6 sm:pb-14">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-3">
            <BusinessMonogram
              name={business.name}
              className="h-11 w-11 text-lg"
            />
            <p className="font-semibold break-words text-ink">{business.name}</p>
          </div>
          <Badge tone="demo" className="shrink-0">
            Contoh profil
          </Badge>
        </div>

        <p className="mt-2 text-xs text-muted">
          {business.category} &middot; {business.location} &middot;{" "}
          {businessAge(business.foundedYear)}
        </p>

        <p className="mt-4 text-sm text-muted">{business.description}</p>

        {business.revenueSeries ? (
          <div className="mt-5 border-t border-line pt-5">
            <RevenueChart series={business.revenueSeries} />
          </div>
        ) : null}

        {business.seeking?.length ? (
          <ul className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
            {business.seeking.map((need) => (
              <li key={need}>
                <Badge tone="mint">{need}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        className="rise-in relative z-10 -mt-6 rounded-2xl bg-forest p-5 shadow-panel sm:ml-10 sm:p-6"
        style={{ animationDelay: "120ms" }}
      >
        <p className="text-xs font-semibold tracking-wide text-mint">
          Ringkasan AI
        </p>
        <p className="mt-2 text-sm text-white">{buildSummary(business)}</p>
        <p className="mt-3 text-xs text-mint">
          Draf ini disusun AI dan dapat diedit pemilik bisnis.
        </p>
      </div>

      <p className="mt-6 text-xs text-muted">
        Tampilan contoh. Profil dan angka di atas adalah ilustrasi, bukan data
        bisnis nyata.
      </p>
    </div>
  );
}
