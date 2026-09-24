import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { BookmarkButton } from "@/components/business/bookmark-button";
import { BusinessMonogram } from "@/components/business/business-monogram";
import { businessAge } from "@/lib/business";
import { ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";

/**
 * One business card in the discovery grid.
 *
 * The card is not itself a link. It contains two controls (save, and the profile
 * link), and wrapping the whole thing in an anchor would either nest them inside
 * a link or require click hijacking, both of which break keyboard and screen
 * reader use. The link at the bottom is the single, explicit way in.
 *
 * Elevation: this card carries --shadow-lift because it leads somewhere. The
 * problem and value cards carry none, so the lift keeps meaning "this is
 * interactive" instead of being the page's default card look.
 *
 * Every figure shown is demo data. The section around this card states that in
 * visible text; nothing here is presented as a real business.
 *
 * The arrow on the profile link marks the one control that leaves the page, so
 * it is the only arrowed control on the page. The other buttons here change
 * state in place and carry no arrow.
 */
export function BusinessCard({
  business,
  saved,
  onToggleSaved,
}: {
  business: Business;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const hasMetrics = Boolean(business.revenueLabel || business.growthLabel);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BusinessMonogram
            name={business.name}
            className="h-12 w-12 text-xl"
          />
          <div>
            <h3 className="text-card-title font-semibold text-ink">
              {business.name}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {business.category} &middot; {business.location}
            </p>
          </div>
        </div>

        <BookmarkButton
          name={business.name}
          saved={saved}
          onToggle={onToggleSaved}
        />
      </div>

      <p className="mt-3 text-sm text-muted">{business.description}</p>

      <p className="mt-3 text-xs text-muted">
        {businessAge(business.foundedYear)}
      </p>

      {hasMetrics ? (
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
          {business.revenueLabel ? (
            <div>
              <dt className="text-xs text-muted">Pendapatan</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">
                {business.revenueLabel}
              </dd>
            </div>
          ) : null}
          {business.growthLabel ? (
            <div>
              <dt className="text-xs text-muted">Pertumbuhan</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">
                {business.growthLabel}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {business.seeking?.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Mencari</span>
          {business.seeking.map((need) => (
            <Badge key={need} tone="mint">
              {need}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-5">
        <Link
          href={ROUTES.business(business.slug)}
          className={buttonStyles({ variant: "secondary", className: "w-full" })}
        >
          Lihat Profil
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
