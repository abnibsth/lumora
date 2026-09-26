import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BookmarkButton } from "@/components/business/bookmark-button";
import { businessAge } from "@/lib/business";
import { ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";

export function BusinessCard({ business, saved, onToggleSaved, editorial = false }: { business: Business; saved: boolean; onToggleSaved: () => void; editorial?: boolean }) {
  return (
    <article className={editorial ? "group flex h-full flex-col overflow-hidden border-b border-line bg-surface pb-6" : "group flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-lift transition-transform duration-200 hover:-translate-y-1"}>
      <div className="relative aspect-[4/3] overflow-hidden bg-mint">
        {business.coverImage ? (
          <Image
            src={business.coverImage}
            alt={`Suasana contoh ${business.name}`}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            style={{ objectPosition: business.coverPosition ?? "center" }}
          />
        ) : null}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <Badge tone="demo">{business.category}</Badge>
          <BookmarkButton name={business.name} saved={saved} onToggle={onToggleSaved} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-medium text-accent">{business.location} · {businessAge(business.foundedYear)}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{business.name}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{business.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {!editorial && business.growthLabel ? <span className="text-xs font-semibold text-accent">{business.growthLabel}</span> : null}
          {business.seeking?.map((need) => <Badge key={need} tone="mint">{editorial ? `Sedang mencari · ${need}` : `Mencari ${need}`}</Badge>)}
        </div>

        <Link href={ROUTES.business(business.slug)} className="mt-6 inline-flex min-h-11 items-center gap-2 self-start border-b-2 border-green text-sm font-semibold text-forest transition-colors hover:border-forest">
          Lihat cerita <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
