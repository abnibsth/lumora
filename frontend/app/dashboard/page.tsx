import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard"
import { fetchBookmarks, fetchMyBusinesses, getMeApi } from "@/lib/api"
import { ROUTES } from "@/lib/constants"

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const pageValue = Number((await searchParams).page)
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const cookieStore = await cookies()
  const cookie = cookieStore.toString()
  const user = await getMeApi(cookie)

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.dashboard)}`)
  }

  const [businesses, bookmarks] = await Promise.all([
    fetchMyBusinesses(cookie, { page, limit: 50 }),
    fetchBookmarks(cookie),
  ])

  return <OwnerDashboard
    user={user}
    initialBusinesses={businesses.data || { items: [], total: 0, page: 1, limit: 50 }}
    initialBookmarks={bookmarks.data?.items || []}
    profilesError={!businesses.ok ? businesses.error : undefined}
    bookmarksError={!bookmarks.ok ? bookmarks.error : undefined}
    defaultSidebarOpen={cookieStore.get("sidebar_state")?.value !== "false"}
  />
}
