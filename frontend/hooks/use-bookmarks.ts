"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addBookmarkApi,
  fetchBookmarks,
  getMeApi,
  removeBookmarkApi,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export function useBookmarks() {
  const pathname = usePathname();
  const router = useRouter();
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMeApi().then(async (user) => {
      if (!active) return;
      setAuthenticated(Boolean(user));
      if (!user) return;

      const bookmarks = await fetchBookmarks();
      if (active && bookmarks.ok) {
        setSavedSlugs(bookmarks.data?.items.map((business) => business.slug) || []);
      } else if (active) {
        setError(bookmarks.error || "Bookmark gagal dimuat.");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function toggleBookmark(slug: string) {
    setError(null);
    if (!authenticated) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const saved = savedSlugs.includes(slug);
    setPendingSlug(slug);
    const result = saved ? await removeBookmarkApi(slug) : await addBookmarkApi(slug);
    setPendingSlug(null);

    if (!result.ok) {
      if (result.code === "unauthenticated") {
        router.push(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setError(result.error || "Bookmark gagal diperbarui.");
      return;
    }

    setSavedSlugs((current) =>
      saved ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }

  return {
    savedSlugs,
    pendingSlug,
    loading: authenticated === null,
    error,
    toggleBookmark,
  };
}
