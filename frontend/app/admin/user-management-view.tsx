"use client";

import { useState } from "react";
import {
  Users,
  ShieldCheck,
  Briefcase,
  Handshake,
  UserCheck,
  Calendar,
  Fingerprint,
  Info,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Lock,
  ShieldAlert,
  KeyRound,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import type { User, UserRole } from "@/types/user";
import type { AdminOverview } from "@/lib/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface UserManagementViewProps {
  user: User;
  overview?: AdminOverview;
}

interface RoleCapability {
  role: UserRole;
  label: string;
  badgeTone: string;
  description: string;
  enforcementNote: string;
  verifiedCapabilities: string[];
  unverifiedOrPlanned: string[];
}

const ROLE_CAPABILITIES: RoleCapability[] = [
  {
    role: "admin",
    label: "Administrator",
    badgeTone: "bg-[#123f32] text-white",
    description:
      "Akses kendali operasional dan CMS platform LUMORA. Memerlukan peran admin pada database dan otorisasi RequireAdmin().",
    enforcementNote:
      "Penegakan Backend: Divalidasi ketat oleh middleware RequireAdmin() pada grup rute /api/v1/admin.",
    verifiedCapabilities: [
      "Akses penuh ke dashboard CMS Admin (/admin)",
      "Membaca ringkasan metrik analitik (GET /api/v1/admin/overview)",
      "Kurasi dan publikasi konten beranda (HomepageEditor)",
      "Inspeksi direktori UMKM, Cerita Usaha, dan Peluang Kemitraan",
      "Katalog FAQ platform dan repositori Media Library",
    ],
    unverifiedOrPlanned: [
      "Manajemen daftar akun pengguna (GET /api/v1/admin/users belum tersedia)",
      "Ubah peran pengguna (Endpoint mutasi role belum tersedia)",
      "Penangguhan akun pengguna (Skema status akun belum ada di database)",
    ],
  },
  {
    role: "umkm",
    label: "Pelaku UMKM",
    badgeTone: "bg-[#b7df68] text-[#123f32]",
    description:
      "Pemilik usaha mikro, kecil, atau menengah yang membangun profil usaha digital dan model bisnis di LUMORA.",
    enforcementNote:
      "Penegakan Alur: Divalidasi melalui routing workspace (/dashboard). Endpoint API backend memvalidasi sesi aktif (RequireSession) dan verifikasi email saat publikasi.",
    verifiedCapabilities: [
      "Pendaftaran mandiri melalui halaman /register (role: umkm)",
      "Akses ruang kerja dasbor UMKM (/dashboard)",
      "Pembuatan & pengeditan profil bisnis (POST/PATCH /api/v1/businesses)",
      "Unggah logo dan foto cover usaha (POST /api/v1/media)",
      "Pembuatan draf profil dengan Lumora AI (POST /api/v1/ai/draft-profile)",
      "Publikasi profil bisnis (memerlukan email terverifikasi)",
      "Pengarsipan profil bisnis (DELETE /api/v1/businesses/:id)",
    ],
    unverifiedOrPlanned: [
      "Galeri foto multi-aset (Backend saat ini mendukung 1 logo dan 1 cover)",
    ],
  },
  {
    role: "mitra",
    label: "Mitra / Investor",
    badgeTone: "bg-[#e7efe9] text-[#123f32]",
    description:
      "Pihak eksternal, pemodal, distributor, atau korporasi yang mencari peluang kerja sama dengan UMKM terdaftar.",
    enforcementNote:
      "Penegakan Alur: Divalidasi melalui navigasi eksplorasi. Endpoint bookmark memvalidasi sesi aktif (RequireSession) tanpa batasan kaku peran di handler.",
    verifiedCapabilities: [
      "Pendaftaran mandiri melalui halaman /register (role: mitra)",
      "Eksplorasi profil bisnis terbit (/explore & GET /api/v1/businesses)",
      "Menyimpan bookmark profil bisnis (GET/POST/DELETE /api/v1/bookmarks)",
      "Melihat detail cerita perjalanan usaha dan Business Model Canvas",
    ],
    unverifiedOrPlanned: [
      "Kirim proposal kemitraan langsung via platform (Belum ada endpoint penawaran)",
      "Room percakapan / pesan privat (Belum didukung API)",
    ],
  },
];

export default function UserManagementView({
  user,
  overview,
}: UserManagementViewProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Safely format dates
  function formatDate(isoString?: string): string {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "-";
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "-";
    }
  }

  async function handleCopyUserId(id: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      }
    } catch {
      // Graceful fallback if clipboard API is blocked
      setCopiedId(false);
    }
  }

  const metrics = overview?.metrics;

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#123f32] px-2.5 py-0.5 text-xs font-semibold text-white">
                <Users className="size-3.5" />
                <span>Pengguna & Role</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#123f32]/20 bg-[#e7efe9] px-2.5 py-0.5 text-xs font-medium text-[#123f32]">
                <KeyRound className="size-3" />
                <span>Kontrak API: Agregat Metrik Aktif</span>
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
              Manajemen Pengguna & Hak Akses
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#526059]">
              Pantau distribusi akun pengguna terdaftar, klasifikasi peran (*role*) resmi, dan batasan
              kewenangan keamanan platform LUMORA sesuai kontrak backend PostgreSQL dan middleware otorisasi.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Statistik Metrik Berdasarkan Backend Riil */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pengguna Terdaftar */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Total Akun Pengguna (Non-Admin)</span>
            <span className="rounded-lg bg-[#e7efe9] p-2 text-[#123f32]">
              <Users className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {metrics ? metrics.totalUsers.toLocaleString("id-ID") : "—"}{" "}
            <span className="text-sm font-normal text-[#526059]">akun</span>
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Total akun terdaftar di luar peran administrator (Sumber: GET /api/v1/admin/overview)
          </p>
        </div>

        {/* Akun UMKM */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Akun Pelaku UMKM</span>
            <span className="rounded-lg bg-[#b7df68]/40 p-2 text-[#123f32]">
              <Briefcase className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {metrics ? metrics.totalUmkmUsers.toLocaleString("id-ID") : "—"}{" "}
            <span className="text-sm font-normal text-[#526059]">akun</span>
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Peran: <code className="font-mono font-semibold">umkm</code> (Pengelola profil bisnis)
          </p>
        </div>

        {/* Akun Mitra */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Akun Mitra & Investor</span>
            <span className="rounded-lg bg-[#e7efe9] p-2 text-[#123f32]">
              <Handshake className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#123f32]">
            {metrics ? metrics.totalMitraUsers.toLocaleString("id-ID") : "—"}{" "}
            <span className="text-sm font-normal text-[#526059]">akun</span>
          </p>
          <p className="mt-1 text-[11px] text-[#526059]">
            Peran: <code className="font-mono font-semibold">mitra</code> (Eksplorasi kemitraan)
          </p>
        </div>

        {/* Sesi Admin Saat Ini */}
        <div className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526059]">Sesi Admin Saat Ini</span>
            <span className="rounded-lg bg-[#123f32] p-2 text-white">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold tracking-tight text-[#123f32] truncate" title={user.name}>
            {user.name}
          </p>
          <p className="mt-1 text-[11px] text-[#526059] truncate" title={user.email}>
            {user.email}
          </p>
        </div>
      </section>

      {/* 3. Kartu Inspeksi Akun Administrator Sesi Saat Ini */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#123f32] flex items-center gap-2">
              <UserCheck className="size-4 text-[#123f32]" />
              <span>Identitas Akun Administrator Sesi Aktif</span>
            </h2>
            <p className="mt-0.5 text-xs text-[#526059]">
              Data terverifikasi dari sesi login pengguna aktif melalui endpoint{" "}
              <code className="font-mono text-[11px]">GET /api/v1/auth/me</code>.
            </p>
          </div>

          <button
            id="admin-user-view-drawer-btn"
            type="button"
            onClick={() => setSelectedUser(user)}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-[#123f32] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0b3027]"
          >
            <span>Lihat Detail Sesi</span>
            <ArrowUpRight className="size-3.5" />
          </button>
        </div>

        {/* Table summary of current user */}
        <div className="overflow-hidden rounded-xl border border-[#d8d8cf] bg-white">
          <Table>
            <TableHeader className="bg-[#f5f2e9]/70">
              <TableRow className="border-b border-[#d8d8cf] hover:bg-transparent">
                <TableHead className="text-xs font-bold text-[#123f32]">Nama Lengkap</TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">Email</TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">Role Sistem</TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">Status Verifikasi Email</TableHead>
                <TableHead className="text-xs font-bold text-[#123f32]">Waktu Terdaftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-[#e7efe9]/40 transition-colors">
                <TableCell className="font-semibold text-xs text-[#123f32]">
                  {user.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#526059]">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge className="border-none bg-[#123f32] text-white text-[11px] font-bold">
                    admin
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>Terverifikasi</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <XCircle className="size-3.5 text-amber-600" />
                      <span>Belum Terverifikasi</span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-[#526059]">
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 4. Matriks Hak Akses & Matriks Kewenangan Role */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#123f32] flex items-center gap-2">
            <Layers className="size-4 text-[#123f32]" />
            <span>Matriks Hak Akses & Kewenangan Peran (Role)</span>
          </h2>
          <p className="mt-0.5 text-xs text-[#526059]">
            Klasifikasi peran resmi yang didukung skema PostgreSQL{" "}
            <code className="font-mono text-[11px]">CHECK (role IN (&apos;umkm&apos;, &apos;mitra&apos;, &apos;admin&apos;))</code>. Setiap hak akses
            telah diverifikasi terhadap middleware dan route backend aktual.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {ROLE_CAPABILITIES.map((cap) => (
            <div
              key={cap.role}
              className="flex flex-col justify-between rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#123f32]">{cap.label}</h3>
                  <Badge className={`border-none text-[11px] font-mono font-bold ${cap.badgeTone}`}>
                    {cap.role}
                  </Badge>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-[#526059]">
                  {cap.description}
                </p>

                <div className="mt-2.5 rounded-lg bg-[#e7efe9]/70 p-2 text-[10px] text-[#123f32] leading-relaxed border border-[#d8d8cf]/60">
                  <span className="font-semibold">{cap.enforcementNote}</span>
                </div>

                {/* Verified Capabilities */}
                <div className="mt-4 space-y-2 border-t border-[#e7efe9] pt-3">
                  <span className="text-[11px] font-bold text-[#123f32] flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Hak Akses Terverifikasi di Kode:</span>
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {cap.verifiedCapabilities.map((item, idx) => (
                      <li key={idx} className="text-[11px] text-[#526059] flex items-start gap-1.5">
                        <span className="mt-1 size-1 rounded-full bg-[#123f32] shrink-0" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Unverified / Planned Capabilities */}
                {cap.unverifiedOrPlanned.length > 0 ? (
                  <div className="mt-3 space-y-1.5 border-t border-[#e7efe9] pt-2.5">
                    <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                      <Lock className="size-3 text-amber-700" />
                      <span>Keterbatasan / Belum Didukung:</span>
                    </span>
                    <ul className="space-y-1 pl-1">
                      {cap.unverifiedOrPlanned.map((item, idx) => (
                        <li key={idx} className="text-[10px] text-[#66736d] flex items-start gap-1">
                          <span className="mt-1 size-1 rounded-full bg-amber-500 shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Panel Kesiapan Direktori & Roadmap API Backend */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#f5f2e9] p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-[#123f32] p-2 text-white shrink-0 mt-0.5">
            <Info className="size-5 text-[#b7df68]" />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#123f32]">
                Status Direktori Seluruh Pengguna & Batasan API
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#526059]">
                Backend Go saat ini baru menyediakan agregasi metrik (total akun per peran) pada{" "}
                <code className="font-mono text-[11px]">GET /api/v1/admin/overview</code>, tetapi{" "}
                <strong>belum menyediakan endpoint pembacaan daftar seluruh akun</strong> (misalnya:{" "}
                <code className="font-mono text-[11px]">GET /api/v1/admin/users</code>). Sesuai prinsip integritas data LUMORA,
                tabel direktori multi-pengguna tidak diisi dengan data dummy.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[#d8d8cf]">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#123f32] flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-700" />
                  <span>Proteksi Mutasi Role & Akun</span>
                </span>
                <p className="text-[11px] leading-relaxed text-[#526059]">
                  Operasi mutasi peran (*role change*) dan penonaktifan akun dinonaktifkan secara sengaja.
                  Peran adalah atribut keamanan (*trust field*) yang membutuhkan audit otorisasi khusus di backend sebelum dapat diubah oleh administrator.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-[#123f32] flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-[#123f32]" />
                  <span>Kebutuhan Kontrak API Tahap Lanjutan</span>
                </span>
                <p className="text-[11px] leading-relaxed text-[#526059]">
                  Untuk menghadirkan tabel direktori pengguna lengkap dengan pencarian dan filter peran, backend memerlukan:
                  query SQL <code className="font-mono text-[10px]">ListUsers</code>, route terproteksi{" "}
                  <code className="font-mono text-[10px]">GET /api/v1/admin/users</code>, dan skema paginasi standar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Drawer Detail Akun (Radix Sheet Sisi Kanan) */}
      <Sheet open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-[#fbfaf6] border-l border-[#d8d8cf] p-6">
          {selectedUser ? (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge className="border-none bg-[#123f32] text-white text-xs font-bold">
                    {selectedUser.role}
                  </Badge>
                  <span className="text-xs font-mono text-[#526059]">Sesi Terautentikasi</span>
                </div>
                <SheetTitle className="text-xl font-bold text-[#123f32] pt-2">
                  {selectedUser.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-[#526059]">
                  Detail informasi profil pengguna yang aman ditampilkan dari sesi login aktif.
                </SheetDescription>
              </SheetHeader>

              {/* Specification Grid */}
              <div className="space-y-3 rounded-xl border border-[#d8d8cf] bg-white p-4 text-xs">
                <h4 className="font-bold text-[#123f32] flex items-center gap-1.5">
                  <Fingerprint className="size-3.5 text-[#123f32]" />
                  <span>Identifikasi Akun</span>
                </h4>

                <div className="space-y-2.5 pt-2 border-t border-[#e7efe9]">
                  <div>
                    <span className="text-[11px] text-[#526059]">User ID (UUID):</span>
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] p-2">
                      <code className="flex-1 font-mono text-[11px] text-[#123f32] truncate">
                        {selectedUser.id}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyUserId(selectedUser.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#123f32] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#0b3027]"
                      >
                        {copiedId ? <Check className="size-3" /> : <Copy className="size-3" />}
                        <span>{copiedId ? "Tersalin" : "Salin"}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#526059]">Nama Tampilan:</span>
                    <p className="font-medium text-[#123f32] text-xs mt-0.5">{selectedUser.name}</p>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#526059]">Alamat Email:</span>
                    <p className="font-mono text-xs text-[#123f32] mt-0.5">{selectedUser.email}</p>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#526059]">Peran Sistem (Role):</span>
                    <p className="font-semibold text-xs text-[#123f32] mt-0.5 capitalize">
                      {selectedUser.role} (Hak Akses Administrator CMS)
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#526059]">Status Verifikasi Email:</span>
                    <div className="mt-1">
                      {selectedUser.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          <span>Terverifikasi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <XCircle className="size-3 text-amber-600" />
                          <span>Belum Terverifikasi</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#526059]">Waktu Registrasi Akun:</span>
                    <p className="text-xs text-[#123f32] mt-0.5 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#526059]" />
                      <span>{formatDate(selectedUser.createdAt)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Disclosure */}
              <div className="rounded-xl border border-[#d8d8cf] bg-[#f5f2e9] p-4 text-xs text-[#526059] space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#123f32]">
                  <Lock className="size-4 text-[#123f32]" />
                  <span>Kepatuhan Keamanan & Privasi Akun</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Kata sandi disimpan dalam bentuk hash <code>argon2id</code> di sisi server dan tidak pernah dikirimkan ke frontend.
                  Token sesi tersimpan aman pada <code>httpOnly cookie</code> yang tidak dapat dibaca oleh script browser.
                </p>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
