"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmailVerificationNotice } from "@/components/auth/email-verification-notice";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { PartnerShell } from "./partner-shell";
import { PartnerOverview } from "./partner-overview";
import { PartnerExploreView } from "./partner-explore-view";
import { PartnerSavedView } from "./partner-saved-view";
import { PartnerProfileView } from "./partner-profile-view";
import { PartnerPreferencesView } from "./partner-preferences-view";
import { addBookmarkApi, fetchBookmarks, logoutApi, removeBookmarkApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { Business } from "@/types/business";
import type { PartnerDashboardView, PartnerProfile } from "@/types/partner";
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
  initialProfile,
  initialBookmarks,
  recentBusinesses,
  defaultSidebarOpen = true,
}: {
  user: User;
  initialProfile: PartnerProfile;
  initialBookmarks: Business[];
  recentBusinesses: Business[];
  defaultSidebarOpen?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryView = searchParams.get("view");

  const [view, setView] = useState<PartnerDashboardView>(() =>
    resolvePartnerView(queryView),
  );
  const [user, setUser] = useState<User>(initialUser);
  const [profile, setProfile] = useState<PartnerProfile>(initialProfile);
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
        // Try to find full business details from recentBusinesses
        const target = recentBusinesses.find((b) => b.slug === slug);
        if (target) {
          setBookmarks((current) => [target, ...current]);
        } else {
          // Re-fetch bookmark list from backend
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
        {!user.emailVerified ? (
          <EmailVerificationNotice user={user} />
        ) : null}

        {view === "dashboard" ? (
          <PartnerOverview
            user={user}
            profile={profile}
            bookmarks={bookmarks}
            recentBusinesses={recentBusinesses}
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
            initialProfile={profile}
            onProfileUpdated={(updated) => setProfile(updated)}
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

