import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAdminOverview, getMeApi } from "@/lib/api";
import AdminShell from "./admin-shell";

export default async function AdminPage() {
  const cookie = (await cookies()).toString();
  const user = await getMeApi(cookie);
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/");

  const result = await fetchAdminOverview(cookie);
  if (!result.ok || !result.data) {
    return <AdminShell user={user}><div className="border border-red-200 bg-red-50 p-5 text-red-800">{result.error || "Overview admin gagal dimuat."}</div></AdminShell>;
  }
  const { metrics, registrationGrowth, recentBusinesses } = result.data;
  const cards = [
    ["Pengguna UMKM", metrics.totalUmkmUsers],
    ["Pengguna mitra", metrics.totalMitraUsers],
    ["Profil aktif", metrics.totalBusinesses],
    ["Profil published", metrics.publishedBusinesses],
  ] as const;
  const maxGrowth = Math.max(...registrationGrowth.map((point) => point.count), 1);

  return (
    <AdminShell user={user}>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-forest">Dashboard administrator</h1>
        <p className="mt-2 text-sm text-muted">Overview read-only dari data produksi LUMORA.</p>
      </div>

      <section aria-label="Statistik utama" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => <Card key={label}><CardHeader><CardDescription>{label}</CardDescription></CardHeader><CardContent className="text-3xl font-bold text-forest">{value}</CardContent></Card>)}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader><CardDescription>Profil baru enam bulan terakhir</CardDescription></CardHeader>
          <CardContent>
            {registrationGrowth.length ? <div className="flex h-56 items-end gap-3 border-b border-line pb-2">{registrationGrowth.map((point) => <div key={point.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs text-muted">{point.count}</span><div className="w-full bg-forest" style={{ height: `${Math.max(6, point.count / maxGrowth * 80)}%` }} /><span className="text-[10px] text-muted">{new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(point.month))}</span></div>)}</div> : <p className="text-sm text-muted">Belum ada data pertumbuhan.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardDescription>Profil terbaru</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table><TableHeader><TableRow><TableHead>Bisnis</TableHead><TableHead>Status</TableHead><TableHead>Verifikasi admin</TableHead></TableRow></TableHeader><TableBody>
              {recentBusinesses.map((business) => <TableRow key={business.id}><TableCell><p className="font-medium text-ink">{business.name}</p><p className="text-xs text-muted">{business.category} · {business.location}</p></TableCell><TableCell><Badge variant="outline">{business.status}</Badge></TableCell><TableCell>{business.verified ? "Terverifikasi" : "Belum"}</TableCell></TableRow>)}
            </TableBody></Table>
            {!recentBusinesses.length ? <p className="py-6 text-sm text-muted">Belum ada profil bisnis.</p> : null}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-sm text-muted">{metrics.unverifiedPublishedBusinesses} profil published belum memiliki badge verifikasi admin. Tahap ini tidak mengubah status atau menyediakan aksi moderasi.</p>
    </AdminShell>
  );
}
