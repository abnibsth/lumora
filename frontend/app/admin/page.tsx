import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { fetchAdminOverview, getMeApi } from "@/lib/api";
import AdminShell from "./admin-shell";
import DashboardView from "./dashboard-view";

export default async function AdminPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const parsedTab = searchParams?.tab ? parseInt(searchParams.tab, 10) : 0;
  const initialTab = isNaN(parsedTab) ? 0 : parsedTab;

  const cookie = (await cookies()).toString();
  const user = await getMeApi(cookie);
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/");


  const result = await fetchAdminOverview(cookie);

  if (!result.ok || !result.data) {
    return (
      <AdminShell user={user}>
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-red-900 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-red-950">
                Gagal Memuat Data Dashboard
              </h2>
              <p className="text-sm text-red-800 leading-relaxed">
                {result.error ||
                  "Terjadi kendala saat menghubungkan ke server backend API LUMORA."}
              </p>
              <div className="pt-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-50 transition-colors shadow-2xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Coba Muat Ulang Halaman</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell user={user} overview={result.data} initialTab={initialTab}>
      <DashboardView overview={result.data} />
    </AdminShell>

  );
}
