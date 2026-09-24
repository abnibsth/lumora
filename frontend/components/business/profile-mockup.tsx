import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { BusinessMonogram } from "@/components/business/business-monogram";
import { JourneyNode } from "@/components/ui/journey-line";
import { RevenueChart } from "@/components/business/revenue-chart";
import { businessAge } from "@/lib/business";
import { cn } from "@/lib/utils";
import type { Business } from "@/types/business";

/**
 * A full business profile, rendered as a large preview for the showcase section.
 *
 * The header band is solid forest where a real profile would show a cover photo.
 * That is the honest substitute: no business photography exists, and generating
 * a photo of a business that does not exist would be fabricated content (R-23).
 * A solid cover keeps the slot visible without faking what fills it.
 *
 * The internal labels are paragraphs, not headings. They label parts of a
 * preview, not parts of this page, and turning them into h3/h4 would push six
 * meaningless stops into the page's heading outline for screen reader users.
 *
 * Founder and team are absent on purpose. PRD 10.8 lists them, but there is no
 * real person behind this demo business, and inventing a name would be exactly
 * the fabricated identity R-18 forbids. The section states on screen that the
 * whole profile is example data.
 */
function BlockLabel({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold text-ink">{children}</p>;
}

export function ProfileMockup({
  business,
  className,
}: {
  business: Business;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface",
        className,
      )}
    >
      <div className="bg-forest p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <BusinessMonogram
              name={business.name}
              className="h-14 w-14 bg-white/10 text-2xl text-mint"
            />
            <div>
              <p className="text-lg font-semibold text-white">
                {business.name}
              </p>
              <p className="mt-0.5 text-sm text-mint">
                {business.category} &middot; {business.location}
              </p>
            </div>
          </div>
          <Badge tone="demo" className="shrink-0">
            Contoh profil
          </Badge>
        </div>

        <p className="mt-5 text-xs text-mint">
          Berdiri sejak {business.foundedYear} &middot;{" "}
          {businessAge(business.foundedYear)}
        </p>
      </div>

      <div className="flex flex-col gap-8 p-6 sm:p-8">
        <div>
          <BlockLabel>Tentang</BlockLabel>
          <p className="mt-2 text-sm text-muted">{business.description}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <BlockLabel>Perkembangan</BlockLabel>

            {business.revenueSeries ? (
              <div className="mt-3 rounded-xl border border-line bg-background p-4">
                <RevenueChart series={business.revenueSeries} />
              </div>
            ) : null}

            <dl className="mt-3 grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <BlockLabel>Perjalanan bisnis</BlockLabel>

            {business.milestones?.length ? (
              <ol className="mt-3 flex flex-col gap-3">
                {business.milestones.map((milestone) => (
                  <li key={milestone.year} className="flex gap-3">
                    <JourneyNode className="mt-px" />
                    <div>
                      <p className="text-xs font-semibold text-accent">
                        {milestone.year}
                      </p>
                      <p className="text-sm text-ink">{milestone.title}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>

        {business.bmc?.length ? (
          <div>
            <BlockLabel>Business Model Canvas</BlockLabel>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {business.bmc.map((block) => (
                <li
                  key={block.label}
                  className="rounded-xl border border-line bg-background p-3"
                >
                  <p className="text-xs text-muted">{block.label}</p>
                  <p className="mt-1 text-sm text-ink">{block.value}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {business.seeking?.length ? (
          <div>
            <BlockLabel>Kebutuhan saat ini</BlockLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {business.seeking.map((need) => (
                <Badge key={need} tone="mint">
                  {need}
                </Badge>
              ))}
            </div>
            {business.seekingObjective ? (
              <p className="mt-2 text-sm text-muted">
                {business.seekingObjective}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
