import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { PartnerDashboard } from "@/components/partner/partner-dashboard";
import {
  fetchBookmarks,
  fetchBusinesses,
  fetchMyBusinesses,
  fetchPartnerProfile,
  getMeApi,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { PartnerProfile } from "@/types/partner";

const emptyPartnerProfile: PartnerProfile = {
  id: "",
  userId: "",
  companyName: "",
  partnerType: "",
  location: "",
  operationalCoverage: "",
  interestedCategories: [],
  partnershipTypes: [],
  description: "",
  shareContact: false,
  contactEmail: "",
  contactPhone: "",
  contactSocial: "",
  searchRegion: "",
  collaborationTypes: [],
  partnershipNeeds: "",
  businessCriteria: "",
  completeness: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string; business?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageValue = Number(resolvedSearchParams.page);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const initialView = resolvedSearchParams.view;
  const cookieStore = await cookies();
  const cookie = cookieStore.toString();
  const user = await getMeApi(cookie);

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.dashboard)}`);
  }

  // Admin users are directed to the admin portal
  if (user.role === "admin") {
    redirect(ROUTES.admin);
  }

  // Partner role workspace
  if (user.role === "mitra") {
    const [partnerRes, bookmarksRes, recentBizRes] = await Promise.all([
      fetchPartnerProfile(cookie),
      fetchBookmarks(cookie),
      fetchBusinesses({ limit: 12 }),
    ]);

    const profile = partnerRes.profile || emptyPartnerProfile;
    const bookmarks = bookmarksRes.data?.items || [];
    const recentBusinesses = recentBizRes.items || [];

    return (
      <PartnerDashboard
        user={user}
        initialView={initialView}
        initialProfile={profile}
        initialBookmarks={bookmarks}
        recentBusinesses={recentBusinesses}
        defaultSidebarOpen={cookieStore.get("sidebar_state")?.value !== "false"}
      />
    );
  }

  // UMKM business owner workspace
  const [businesses, bookmarks] = await Promise.all([
    fetchMyBusinesses(cookie, { page, limit: 50 }),
    fetchBookmarks(cookie),
  ]);

  return (
    <OwnerDashboard
      user={user}
      initialBusinesses={
        businesses.data || { items: [], total: 0, page: 1, limit: 50 }
      }
      initialBookmarks={bookmarks.data?.items || []}
      profilesError={!businesses.ok ? businesses.error : undefined}
      bookmarksError={!bookmarks.ok ? bookmarks.error : undefined}
      defaultSidebarOpen={cookieStore.get("sidebar_state")?.value !== "false"}
    />
  );
}
