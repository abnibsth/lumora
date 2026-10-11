"use client";

import { buttonStyles } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/use-bookmarks";

export function BusinessBookmarkAction({ slug }: { slug: string }) {
  const { savedSlugs, pendingSlug, loading, error, toggleBookmark } = useBookmarks();
  const saved = savedSlugs.includes(slug);
  const pending = pendingSlug === slug;

  return (
    <div>
      <button
        type="button"
        onClick={() => toggleBookmark(slug)}
        disabled={pending || loading}
        aria-pressed={saved}
        className={buttonStyles({ variant: "secondary", className: "w-full sm:w-auto" })}
      >
        {pending ? "Menyimpan..." : loading ? "Memeriksa..." : saved ? "Tersimpan" : "Simpan"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
