"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";
import { removeBookmarkApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";

export function SavedBusinesses({ businesses, onBusinessesChange }: { businesses: Business[]; onBusinessesChange: (businesses: Business[]) => void }) {
  const router = useRouter();
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(slug: string) {
    setPendingSlug(slug);
    setError(null);
    const result = await removeBookmarkApi(slug);
    setPendingSlug(null);

    if (!result.ok) {
      if (result.code === "unauthenticated") {
        router.push(`${ROUTES.login}?next=${ROUTES.dashboard}`);
        return;
      }
      setError(result.error || "Bookmark gagal dihapus.");
      return;
    }

    onBusinessesChange(businesses.filter((business) => business.slug !== slug));
  }

  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-5 sm:p-7" aria-labelledby="saved-businesses-heading">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Untuk dipantau</p>
          <h2 id="saved-businesses-heading" className="mt-1 text-2xl font-semibold text-ink">Profil tersimpan</h2>
        </div>
        <p className="text-sm text-muted">{businesses.length} profil</p>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}

      {businesses.length === 0 ? (
        <div className="mt-6 border-y border-line py-8">
          <p className="text-muted">Belum ada profil yang disimpan ke akunmu.</p>
          <Link href={ROUTES.explore} className={buttonStyles({ variant: "secondary", className: "mt-4" })}>
            Jelajahi bisnis
          </Link>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-line border-y border-line">
          {businesses.map((business) => (
            <article key={business.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink">{business.name}</h3>
                <p className="mt-1 text-sm text-muted">{business.category} · {business.location}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={ROUTES.business(business.slug)} className={buttonStyles({ variant: "secondary" })}>
                  Lihat profil
                </Link>
                <button
                  type="button"
                  onClick={() => remove(business.slug)}
                  disabled={pendingSlug !== null}
                  className="min-h-11 px-3 text-sm font-medium text-red-700 underline decoration-red-300 underline-offset-4 hover:decoration-red-700 disabled:opacity-60"
                >
                  {pendingSlug === business.slug ? "Menghapus..." : "Hapus simpanan"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
