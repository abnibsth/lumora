"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { BusinessCard } from "@/components/business/business-card";
import { businesses } from "@/data/businesses";
import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/types/business";
import {
  getSavedSlugsServerSnapshot,
  getSavedSlugsSnapshot,
  subscribeSavedSlugs,
  writeSavedSlugs,
} from "@/lib/bookmarks";
import { cn } from "@/lib/utils";

type Filter = "Semua" | BusinessCategory;
const filters: Filter[] = ["Semua", ...BUSINESS_CATEGORIES];

export function BusinessDiscoveryExplorer({ full = false }: { full?: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const savedSlugs = useSyncExternalStore(
    subscribeSavedSlugs,
    getSavedSlugsSnapshot,
    getSavedSlugsServerSnapshot,
  );

  const visibleBusinesses = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id");
    return businesses.filter((business) => {
      const matchesCategory = filter === "Semua" || business.category === filter;
      const matchesQuery =
        !full ||
        !term ||
        [business.name, business.category, business.location, business.description]
          .join(" ")
          .toLocaleLowerCase("id")
          .includes(term);
      return matchesCategory && matchesQuery;
    }).slice(0, full ? undefined : 6);
  }, [filter, full, query]);

  function toggleSaved(slug: string) {
    writeSavedSlugs(
      savedSlugs.includes(slug)
        ? savedSlugs.filter((saved) => saved !== slug)
        : [...savedSlugs, slug],
    );
  }

  return (
    <div>
      {full ? (
        <div className="relative mt-10">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>
          <label htmlFor="business-search" className="sr-only">Cari bisnis</label>
          <input
            id="business-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama bisnis, kategori, atau lokasi..."
            className="min-h-16 w-full rounded-2xl border border-line-strong bg-surface py-4 pl-14 pr-5 text-base text-ink shadow-lift placeholder:text-muted focus:border-forest sm:text-lg"
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter kategori" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
          {filters.map((option) => {
            const active = option === filter;
            return (
              <button key={option} type="button" aria-pressed={active} onClick={() => setFilter(option)} className={cn("min-h-11 shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors", active ? "border-forest bg-forest text-white" : "border-line-strong bg-surface text-ink hover:bg-mint")}>
                {option}
              </button>
            );
          })}
        </div>
        <p role="status" className="text-sm text-muted">
          {full
            ? `${visibleBusinesses.length} bisnis ditemukan${savedSlugs.length ? ` · ${savedSlugs.length} disimpan` : ""}`
            : savedSlugs.length
              ? `${savedSlugs.length} profil disimpan di perangkat ini.`
              : ""}
        </p>
      </div>

      {visibleBusinesses.length ? (
        <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleBusinesses.map((business) => (
            <li key={business.id}>
              <BusinessCard business={business} saved={savedSlugs.includes(business.slug)} onToggleSaved={() => toggleSaved(business.slug)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink">Belum ada bisnis yang cocok</h2>
          <p className="mt-2 text-sm text-muted">Coba kata kunci lain atau pilih kategori Semua.</p>
        </div>
      )}
    </div>
  );
}
