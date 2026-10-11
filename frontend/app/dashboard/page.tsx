import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard"
import { fetchBookmarks, fetchMyBusinesses, getMeApi } from "@/lib/api"
import { ROUTES } from "@/lib/constants"

export default async function Page() {
  const cookie = (await cookies()).toString()
  const user = await getMeApi(cookie)

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.dashboard)}`)
  }

  const [businesses, bookmarks] = await Promise.all([
    fetchMyBusinesses(cookie),
    fetchBookmarks(cookie),
  ])

  return <OwnerDashboard
    user={user}
    initialBusinesses={businesses.data?.items || []}
    initialBookmarks={bookmarks.data?.items || []}
    initialError={!businesses.ok ? businesses.error : !bookmarks.ok ? bookmarks.error : undefined}
  />
}
