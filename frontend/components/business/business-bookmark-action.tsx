"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { cn } from "@/lib/utils";

export function BusinessBookmarkAction({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const { savedSlugs, pendingSlug, loading, error, toggleBookmark } = useBookmarks();
  const saved = savedSlugs.includes(slug);
  const pending = pendingSlug === slug;

  return (
    <div className={cn("w-full sm:w-auto", className)}>
      <button
        type="button"
        onClick={() => toggleBookmark(slug)}
        disabled={pending || loading}
        aria-pressed={saved}
        className={buttonStyles({
          variant: "secondary",
          className: cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl font-semibold transition-all duration-200",
            saved
              ? "bg-soft-green/80 border-forest/40 text-forest shadow-xs"
              : "border-line-strong bg-surface text-forest hover:bg-soft-green/60 active:scale-[0.98]"
          ),
        })}
      >
        {pending || loading ? (
          <Loader2 className="size-4 animate-spin text-forest" />
        ) : (
          <Bookmark
            className={cn(
              "size-4 transition-colors",
              saved ? "fill-forest text-forest" : "text-forest"
            )}
          />
        )}
        <span>
          {pending
            ? "Menyimpan..."
            : loading
              ? "Memeriksa..."
              : saved
                ? "Tersimpan di Akun"
                : "Simpan Profil"}
        </span>
      </button>
      {error ? (
        <p className="mt-2 text-xs text-red-700 leading-tight" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
