"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { PartnerShell } from "./partner-shell";
import { PartnerOverview } from "./partner-overview";
import { PartnerExploreView } from "./partner-explore-view";
import { PartnerSavedView } from "./partner-saved-view";
import { PartnerProfileView } from "./partner-profile-view";
import { PartnerPreferencesView } from "./partner-preferences-view";
import {
  addBookmarkApi,
  fetchBookmarks,
  logoutApi,
  removeBookmarkApi,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";
import type {
  PartnerDashboardView,
  PartnerProfile,
  PartnerPreferences,
  BusinessMatchList,
} from "@/types/partner";
import type { User } from "@/types/user";

function resolvePartnerView(raw: string | null): PartnerDashboardView {
  switch (raw) {
    case "explore":
    case "saved":
    case "profile":
    case "preferences":
    case "settings":
      return raw;
    case "dashboard":
    default:
      return "dashboard";
  }
}

export function PartnerDashboard({
  user: initialUser,
  initialView,
  initialProfile,
  initialPreferences,
  initialMatches,
  initialBookmarks,
  recentBusinesses,
  defaultSidebarOpen = true,
}: {
  user: User;
  initialView?: string;
  initialProfile: PartnerProfile;
  initialPreferences: PartnerPreferences;
  initialMatches?: BusinessMatchList;
  initialBookmarks: Business[];
  recentBusinesses: Business[];
  defaultSidebarOpen?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryView = searchParams.get("view") || initialView || null;

  const [view, setView] = useState<PartnerDashboardView>(() =>
    resolvePartnerView(queryView),
  );
  const [user, setUser] = useState<User>(initialUser);
  const [profile, setProfile] = useState<PartnerProfile>(initialProfile);
  const [preferences, setPreferences] = useState<PartnerPreferences>(initialPreferences);
  const [matches, setMatches] = useState<BusinessMatchList | undefined>(initialMatches);
  const [bookmarks, setBookmarks] = useState<Business[]>(initialBookmarks);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const [, startTransition] = useTransition();

  // Sync state if query param changes externally (e.g. back/forward navigation)
  useEffect(() => {
    setView(resolvePartnerView(queryView));
  }, [queryView]);

  function handleViewChange(nextView: PartnerDashboardView) {
    setView(nextView);
    startTransition(() => {
      const url = nextView === "dashboard" ? "/dashboard" : `/dashboard?view=${nextView}`;
      router.push(url, { scroll: false });
    });
  }

  async function handleToggleBookmark(slug: string) {
    const isSaved = bookmarks.some((b) => b.slug === slug);
    setPendingSlug(slug);

    if (isSaved) {
      const result = await removeBookmarkApi(slug);
      setPendingSlug(null);
      if (result.ok) {
        setBookmarks((current) => current.filter((b) => b.slug !== slug));
      }
    } else {
      const result = await addBookmarkApi(slug);
      setPendingSlug(null);
      if (result.ok) {
        const target = recentBusinesses.find((b) => b.slug === slug);
        if (target) {
          setBookmarks((current) => [target, ...current]);
        } else {
          const fresh = await fetchBookmarks();
          if (fresh.ok && fresh.data) {
            setBookmarks(fresh.data.items);
          }
        }
      }
    }
  }

  async function handleLogout() {
    setLogoutPending(true);
    await logoutApi();
    router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <PartnerShell
      user={user}
      view={view}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
      logoutPending={logoutPending}
      savedCount={bookmarks.length}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      <div className="space-y-6">
        {view === "dashboard" ? (
          <PartnerOverview
            user={user}
            profile={profile}
            preferences={preferences}
            bookmarks={bookmarks}
            matches={matches}
            onNavigate={handleViewChange}
            onToggleBookmark={handleToggleBookmark}
            pendingSlug={pendingSlug}
          />
        ) : null}

        {view === "explore" ? (
          <PartnerExploreView
            initialBusinesses={recentBusinesses}
            savedSlugs={new Set(bookmarks.map((b) => b.slug))}
            onToggleBookmark={handleToggleBookmark}
            pendingSlug={pendingSlug}
            preferences={preferences}
          />
        ) : null}

        {view === "saved" ? (
          <PartnerSavedView
            bookmarks={bookmarks}
            onNavigate={handleViewChange}
            onToggleBookmark={handleToggleBookmark}
            pendingSlug={pendingSlug}
          />
        ) : null}

        {view === "profile" ? (
          <PartnerProfileView
            user={user}
            initialProfile={profile}
            onProfileUpdated={(updated) => setProfile(updated)}
          />
        ) : null}

        {view === "preferences" ? (
          <PartnerPreferencesView
            initialPreferences={preferences}
            onPreferencesUpdated={(updated) => {
              setPreferences(updated);
            }}
          />
        ) : null}

        {view === "settings" ? (
          <div className="mx-auto max-w-4xl space-y-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-forest sm:text-3xl">
                Pengaturan Akun Mitra
              </h1>
              <p className="mt-1 text-sm text-muted">
                Perbarui nama pengguna, ubah kata sandi, atau kelola akun LUMORA Anda.
              </p>
            </div>
            <AccountSettings user={user} onUserChange={(updated) => setUser(updated)} />
          </div>
        ) : null}
      </div>
    </PartnerShell>
  );
}
