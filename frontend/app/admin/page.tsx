import AdminShell from "./admin-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Store,
  Clock,
  Users,
  Handshake,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

const metrics = [
  {
    label: "Total UMKM Terdaftar",
    value: "128",
    change: "+14% bulan ini",
    subtext: "116 terverifikasi aktif",
    icon: Store,
  },
  {
    label: "Menunggu Verifikasi",
    value: "12",
    change: "Perlu ditinjau",
    subtext: "3 berkas baru hari ini",
    icon: Clock,
    highlight: true,
  },
  {
    label: "Total Pengguna",
    value: "246",
    change: "+28 pengguna baru",
    subtext: "UMKM & calon mitra",
    icon: Users,
  },
  {
    label: "Peluang Kerja Sama",
    value: "18",
    change: "Aktif tayang",
    subtext: "F&B, Kriya, dan Jasa",
    icon: Handshake,
  },
];

const growthData = [
  { month: "Mei", value: 42 },
  { month: "Jun", value: 58 },
  { month: "Jul", value: 71 },
  { month: "Agu", value: 89 },
  { month: "Sep", value: 110 },
  { month: "Okt", value: 128 },
];

const latestActivities = [
  {
    title: "Kopi Ruang Senja memperbarui profil bisnis",
    time: "10 menit lalu",
    category: "UMKM",
  },
  {
    title: "Tenun Ikat Lestari mendaftar verifikasi UMKM",
    time: "25 menit lalu",
    category: "Verifikasi",
  },
  {
    title: "Mitra Pemodal mengajukan ketertarikan pada Sambal Bu Broto",
    time: "1 jam lalu",
    category: "Peluang",
  },
  {
    title: "Draf Business Model Canvas baru dibuat melalui AI",
    time: "3 jam lalu",
    category: "AI Chat",
  },
];

const latestUmkm = [
  {
    id: "UMKM-001",
    name: "Kopi Ruang Senja",
    category: "F&B",
    city: "Bandung",
    date: "10 Okt 2026",
    status: "Terverifikasi",
    statusVariant: "default" as const,
  },
  {
    id: "UMKM-002",
    name: "Tenun Ikat Lestari",
    category: "Kriya",
    city: "Yogyakarta",
    date: "10 Okt 2026",
    status: "Menunggu Review",
    statusVariant: "secondary" as const,
  },
  {
    id: "UMKM-003",
    name: "Dapur Rasa Mandiri",
    category: "F&B",
    city: "Surabaya",
    date: "09 Okt 2026",
    status: "Menunggu Review",
    statusVariant: "secondary" as const,
  },
  {
    id: "UMKM-004",
    name: "Batik Surya Alam",
    category: "Fashion",
    city: "Solo",
    date: "08 Okt 2026",
    status: "Terverifikasi",
    statusVariant: "default" as const,
  },
  {
    id: "UMKM-005",
    name: "Keripik Singkong Barokah",
    category: "Camilan",
    city: "Malang",
    date: "07 Okt 2026",
    status: "Draf Profil",
    statusVariant: "outline" as const,
  },
];

export default function AdminPage() {
  return (
    <AdminShell>
      {/* Header Overview */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
              Dashboard Overview
            </h1>
            <Badge variant="outline" className="border-forest/20 text-forest">
              Data Demo
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[#66736d]">
            Selamat datang di CMS Administrasi LUMORA. Pantau pertumbuhan UMKM, permohonan verifikasi, dan peluang kemitraan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-forest text-surface hover:bg-forest-deep">
            Versi Prototype 0.1
          </Badge>
        </div>
      </div>

      {/* Security & Prototype Notice Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <div className="leading-relaxed">
          <p className="font-semibold text-amber-950">
            Catatan Keamanan & Status Integrasi:
          </p>
          <p className="mt-0.5 text-xs text-amber-900/90 sm:text-sm">
            Halaman ini saat ini berstatus <strong>Prototype UI</strong>. Belum terhubung dengan sesi autentikasi backend produksi atau sistem otorisasi berbasis hak akses (RBAC). Semua angka, metrik, dan tabel di bawah disajikan sebagai data demo visual.
          </p>
        </div>
      </div>

      {/* Metrics Section Cards */}
      <section aria-label="Statistik Utama" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <Card
            key={item.label}
            className="border-[#d8d8cf] bg-[#fbfaf6] shadow-xs transition-shadow hover:shadow-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-medium text-[#66736d]">
                {item.label}
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#e7efe9] text-forest">
                <item.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-forest">
                {item.value}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {item.highlight ? (
                  <Badge variant="secondary" className="bg-[#b7df68]/40 text-forest text-[11px] font-semibold">
                    {item.change}
                  </Badge>
                ) : (
                  <span className="flex items-center font-medium text-forest">
                    <TrendingUp className="mr-1 size-3 text-[#245f45]" />
                    {item.change}
                  </span>
                )}
                <span className="text-[#66736d]">· {item.subtext}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Chart & Activity Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Growth Visualization Card */}
        <Card className="border-[#d8d8cf] bg-[#fbfaf6]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-forest">
                  Pertumbuhan UMKM Terdaftar
                </CardTitle>
                <CardDescription className="text-xs text-[#66736d]">
                  Tren pendaftaran 6 bulan terakhir (Mei – Oktober 2026)
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-[#d8d8cf] text-xs text-[#66736d]">
                Data Demo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="mt-4 flex h-60 items-end justify-around gap-3 border-b border-[#d8d8cf] pb-2"
              role="img"
              aria-label="Grafik bar pertumbuhan UMKM demo"
            >
              {growthData.map((point) => {
                const heightPercent = Math.round((point.value / 128) * 85);
                return (
                  <div
                    key={point.month}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-medium text-forest">
                      {point.value}
                    </span>
                    <div
                      className="w-full max-w-10 rounded-t-md bg-[#123f32] transition-all hover:bg-[#245f45]"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs text-[#66736d]">{point.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-[#66736d]">
              <span>Rata-rata pertumbuhan: +21.4% / bulan</span>
              <span className="flex items-center gap-1 text-forest font-medium">
                Target Q4: 150 UMKM <ArrowUpRight className="size-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Latest Activity Stream */}
        <Card className="border-[#d8d8cf] bg-[#fbfaf6]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-forest">
                  Aktivitas Terbaru
                </CardTitle>
                <CardDescription className="text-xs text-[#66736d]">
                  Log kegiatan platform (Contoh simulasi)
                </CardDescription>
              </div>
              <Activity className="size-4 text-forest" />
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-[#d8d8cf]/70">
              {latestActivities.map((act, index) => (
                <li key={index} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[#b7df68] ring-2 ring-[#b7df68]/40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-ink">
                      {act.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#66736d]">
                      <span>{act.time}</span>
                      <span>•</span>
                      <span className="rounded bg-[#e7efe9] px-1.5 py-0.5 text-[10px] font-medium text-forest">
                        {act.category}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Latest Businesses Table */}
      <Card className="mt-6 border-[#d8d8cf] bg-[#fbfaf6]">
        <CardHeader>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-base font-semibold text-forest">
                Daftar UMKM Terbaru
              </CardTitle>
              <CardDescription className="text-xs text-[#66736d]">
                5 pendaftaran dan pembaruan profil bisnis terakhir
              </CardDescription>
            </div>
            <span className="text-xs text-[#66736d]">
              Menampilkan data demo visual
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#e7efe9]/60">
              <TableRow className="border-[#d8d8cf]">
                <TableHead className="font-semibold text-forest">ID</TableHead>
                <TableHead className="font-semibold text-forest">Nama Usaha</TableHead>
                <TableHead className="font-semibold text-forest">Kategori</TableHead>
                <TableHead className="font-semibold text-forest">Kota</TableHead>
                <TableHead className="font-semibold text-forest">Tanggal</TableHead>
                <TableHead className="font-semibold text-forest">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#d8d8cf]">
              {latestUmkm.map((umkm) => (
                <TableRow key={umkm.id} className="border-[#d8d8cf] hover:bg-[#e7efe9]/40">
                  <TableCell className="font-mono text-xs text-[#66736d]">
                    {umkm.id}
                  </TableCell>
                  <TableCell className="font-medium text-ink">
                    {umkm.name}
                  </TableCell>
                  <TableCell className="text-sm text-forest">
                    {umkm.category}
                  </TableCell>
                  <TableCell className="text-sm text-[#66736d]">
                    {umkm.city}
                  </TableCell>
                  <TableCell className="text-xs text-[#66736d]">
                    {umkm.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={umkm.statusVariant}
                      className={
                        umkm.status === "Terverifikasi"
                          ? "bg-forest text-surface"
                          : umkm.status === "Menunggu Review"
                            ? "bg-[#b7df68]/40 text-forest border-[#b7df68]/80 font-semibold"
                            : "border-[#d8d8cf] text-[#66736d]"
                      }
                    >
                      {umkm.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

