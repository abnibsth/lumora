"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { BusinessCard } from "@/components/business/business-card";
import { businesses } from "@/data/businesses";
import {
  discoveryFilters,
  discoverySection,
  type DiscoveryFilter,
} from "@/data/landing";
import {
  getSavedSlugsServerSnapshot,
  getSavedSlugsSnapshot,
  subscribeSavedSlugs,
  writeSavedSlugs,
} from "@/lib/bookmarks";
import { cn } from "@/lib/utils";

/**
 * The interactive half of the discovery section: the category filter and the
 * save toggles.
 *
 * Kept as its own client component so the section heading, the demo disclosure,
 * and the closing link stay server-rendered. Only what needs state crosses the
 * boundary.
 *
 * The filter is a real filter over the data, and the list is derived from the
 * category union, so an empty result is possible if a category ever has no
 * businesses. That case gets a written message rather than an empty grid (R-27).
 *
 * The saved list comes from an external store rather than an effect, so the
 * server renders it as empty and React fills it in straight after hydration. The
 * count below the filters is a live region, so pressing save is announced rather
 * than only shown.
 */
export function BusinessDiscoveryExplorer() {
  const [filter, setFilter] = useState<DiscoveryFilter>("Semua");
  const savedSlugs = useSyncExternalStore(
    subscribeSavedSlugs,
    getSavedSlugsSnapshot,
    getSavedSlugsServerSnapshot,
  );

  const visibleBusinesses = useMemo(
    () =>
      filter === "Semua"
        ? businesses
        : businesses.filter((business) => business.category === filter),
    [filter],
  );

  function toggleSaved(slug: string) {
    writeSavedSlugs(
      savedSlugs.includes(slug)
        ? savedSlugs.filter((saved) => saved !== slug)
        : [...savedSlugs, slug],
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter kategori"
          className="flex flex-wrap gap-2"
        >
          {discoveryFilters.map((option) => {
            const active = option === filter;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option)}
                className={cn(
                  "min-h-11 rounded-xl border px-4 text-sm font-medium transition-colors duration-200 ease-out",
                  active
                    ? "border-forest bg-forest text-white"
                    : "border-line-strong bg-surface text-ink hover:bg-background",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        <p role="status" className="text-xs text-muted">
          {savedSlugs.length > 0
            ? `${savedSlugs.length} profil disimpan di perangkat ini.`
            : ""}
        </p>
      </div>

      {visibleBusinesses.length > 0 ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBusinesses.map((business) => (
            <li key={business.id}>
              <BusinessCard
                business={business}
                saved={savedSlugs.includes(business.slug)}
                onToggleSaved={() => toggleSaved(business.slug)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
          {discoverySection.emptyState}
        </p>
      )}
    </>
  );
}
