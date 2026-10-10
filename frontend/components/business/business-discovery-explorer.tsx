"use client";

import { Fragment, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Select } from "radix-ui";
import { motion, useReducedMotion } from "motion/react";
import { BusinessCard } from "@/components/business/business-card";
import { businesses as defaultBusinesses } from "@/data/businesses";
import { fetchBusinesses } from "@/lib/api";
import { BUSINESS_CATEGORIES, type BusinessCategory, type Business } from "@/types/business";
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
  const reducedMotion = useReducedMotion();
  const [data, setData] = useState<Business[]>(defaultBusinesses);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const savedSlugs = useSyncExternalStore(
    subscribeSavedSlugs,
    getSavedSlugsSnapshot,
    getSavedSlugsServerSnapshot,
  );

  useEffect(() => {
    let active = true;
    fetchBusinesses({ limit: 50 })
      .then((res) => {
        if (active && res.items && res.items.length > 0) {
          setData(res.items);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const visibleBusinesses = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id");
    return data.filter((business) => {
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
  }, [data, filter, full, query]);

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
        <div className="relative">
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
            placeholder="Cari bisnis, kategori, atau kota..."
            className="min-h-16 w-full rounded-xl border border-line-strong bg-surface py-4 pr-5 pl-14 text-base text-ink shadow-[0_8px_24px_rgba(23,63,50,0.06)] placeholder:text-muted focus:border-forest sm:text-lg"
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {full ? (
          <Select.Root value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <Select.Trigger id="business-category-select" aria-label="Filter kategori bisnis" className="inline-flex min-h-11 w-full items-center justify-between gap-4 rounded-xl border border-line-strong bg-surface px-4 text-sm font-medium text-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest lg:w-64">
              <Select.Value /><Select.Icon aria-hidden="true">⌄</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content position="popper" sideOffset={6} className="z-[60] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg">
                <Select.ScrollUpButton className="text-center text-forest">⌃</Select.ScrollUpButton>
                <Select.Viewport>
                  {filters.map((option) => (
                    <Select.Item key={option} value={option} className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg px-3 text-sm text-ink outline-none data-[highlighted]:bg-soft-green data-[state=checked]:font-semibold">
                      <Select.ItemText>{option}</Select.ItemText><Select.ItemIndicator aria-hidden="true">✓</Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton className="text-center text-forest">⌄</Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        ) : <div role="group" aria-label="Filter kategori" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
          {filters.map((option) => {
            const active = option === filter;
            return (
              <button key={option} type="button" aria-pressed={active} onClick={() => setFilter(option)} className={cn("min-h-11 shrink-0 rounded-xl border px-4 text-sm font-medium transition-colors", active ? "border-forest bg-forest text-white" : "border-line-strong bg-surface text-ink hover:bg-mint")}>
                {option}
              </button>
            );
          })}
        </div>}
        <p role="status" className="text-sm text-muted">
          {full
            ? `${visibleBusinesses.length} bisnis ditemukan${savedSlugs.length ? ` · ${savedSlugs.length} disimpan` : ""}`
            : savedSlugs.length
              ? `${savedSlugs.length} profil disimpan di perangkat ini.`
              : ""}
        </p>
      </div>

      {visibleBusinesses.length ? (
        <ul className="mt-8 grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {visibleBusinesses.map((business, index) => (
            <Fragment key={business.id}>
              {full && index === 6 ? (
                <li className="border-y border-line py-10 md:col-span-2 xl:col-span-3">
                  <p className="text-sm font-medium text-accent">Cerita dari berbagai kota</p>
                  <p className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink md:text-4xl">
                    Usaha lokal tumbuh dengan cara yang berbeda di setiap tempat.
                  </p>
                </li>
              ) : null}
              <motion.li initial={reducedMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.45, delay: reducedMotion ? 0 : Math.min(index, 5) * 0.05 } }} viewport={{ once: true, amount: 0.1 }} whileHover={reducedMotion ? undefined : { y: -3 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}>
                <BusinessCard business={business} saved={savedSlugs.includes(business.slug)} onToggleSaved={() => toggleSaved(business.slug)} editorial={full} />
              </motion.li>
            </Fragment>
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
