"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Plus, Pencil, BookOpen, PanelsTopLeft, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completionFor, type EditorSection } from "@/lib/dashboard";
import type { OwnedBusiness } from "@/types/business";
import { DashboardOnboarding } from "./dashboard-onboarding";

export function DashboardOverview({ name, total, savedCount, profile, businesses, profilesError, bookmarksError, onSelect, onCreate, onEdit, onSaved, onRetry, busy = false }: {
  name: string; total: number; savedCount: number; profile: OwnedBusiness | null; businesses: OwnedBusiness[];
  profilesError?: string; bookmarksError?: string; onSelect: (id: string) => void; onCreate: () => void;
  onEdit: (section: EditorSection) => void; onSaved: () => void; onRetry: () => void; busy?: boolean;
}) {
  const reduced = useReducedMotion();
  const completion = completionFor(profilesError ? null : profile);
  const isEmpty = !profilesError && total === 0;
  const displayName = name.trim();
  const stats = [
    { label: "Profil bisnis", value: profilesError ? "Tidak tersedia" : String(total), hint: "Draft dan profil terbit milikmu" },
    { label: "Kelengkapan profil", value: profilesError ? "Tidak tersedia" : completion ? `${completion.percent}%` : isEmpty ? "Belum ada profil" : "Pilih profil", hint: profile && !profilesError ? profile.name : "Checklist informasi usaha" },
    { label: "Profil tersimpan", value: bookmarksError ? "Tidak tersedia" : String(savedCount), hint: "Bisnis yang kamu simpan ke akun" },
  ];

  return (
    <motion.section initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} aria-labelledby="workspace-welcome" className="mb-6 space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-medium text-accent">Business Workspace</p>
          <h1 id="workspace-welcome" className="mt-2 break-words text-2xl font-semibold tracking-tight text-forest sm:text-3xl">Selamat datang{displayName ? `, ${displayName}` : ""}.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{isEmpty ? "Mulai susun profil usahamu agar calon mitra bisa mengenal bisnis dan ceritamu." : "Kelola informasi usaha, lanjutkan draft, dan siapkan profil untuk calon mitra."}</p>
        </div>
        <Button onClick={onCreate} disabled={busy} className="min-h-11 w-fit shrink-0 rounded-lg bg-forest px-5 text-white hover:bg-deep-forest"><Plus />Buat profil</Button>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="min-w-0 rounded-xl border border-line/60 bg-surface p-5">
            <dt className="text-xs font-medium text-muted">{item.label}</dt>
            <dd className={`mt-2 font-semibold tabular-nums tracking-tight text-forest ${/^\d/.test(item.value) ? "text-3xl" : "text-lg"}`}>{item.value}</dd>
            <p className="mt-2 truncate text-xs text-muted" title={item.hint}>{item.hint}</p>
          </div>
        ))}
      </dl>

      {profilesError ? (
        <Card role="alert" className="gap-3 rounded-xl border-line/60 p-5 shadow-none sm:p-6">
          <h2 className="text-lg font-semibold text-forest">Profil belum dapat dimuat</h2>
          <p className="text-sm leading-6 text-muted">{profilesError}</p>
          <Button variant="outline" onClick={onRetry} disabled={busy} className="min-h-11 w-fit rounded-lg border-line px-4 text-forest">{busy ? "Memuat..." : "Coba lagi"}</Button>
        </Card>
      ) : isEmpty ? (
        <DashboardOnboarding onCreate={onCreate} busy={busy} />
      ) : completion && profile ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="min-w-0 gap-0 rounded-xl border-line/60 p-5 shadow-none sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs font-medium text-muted">Bisnis yang dikelola</p><h2 className="mt-2 break-words text-lg font-semibold tracking-tight text-forest">{profile.name}</h2></div>
              <Badge className={`gap-1.5 rounded-md border-0 px-2.5 py-1 text-xs ${profile.status === "published" ? "bg-soft-green text-forest" : "bg-ivory text-muted"}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${profile.status === "published" ? "bg-forest" : "bg-muted"}`} />{profile.status === "published" ? "Terbit" : "Draft"}</Badge>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{profile.category}</span><span aria-hidden="true">·</span><MapPin className="size-3" aria-hidden="true" /><span>{profile.location}</span></p>
            {businesses.length > 1 ? <div className="mt-4"><label htmlFor="overview-profile" className="sr-only">Pilih bisnis yang dikelola</label><select id="overview-profile" value={profile.id} disabled={busy} onChange={(event) => onSelect(event.target.value)} className="min-h-11 w-full rounded-lg border border-line/60 bg-ivory px-3 text-sm">{businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : null}
            <div className="mt-5 border-t border-line/50 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><h3 className="font-medium text-forest">Kelengkapan informasi</h3><span className="text-muted">{completion.completed} dari {completion.total} bagian</span></div>
              <div role="progressbar" aria-label={`Kelengkapan ${profile.name}`} aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${completion.completed} dari ${completion.total} bagian checklist`} className="mt-3 h-2 overflow-hidden rounded-full bg-soft-green"><div className="h-full rounded-full bg-forest" style={{ width: `${completion.percent}%` }} /></div>
              <ul className="mt-3 grid gap-x-3 sm:grid-cols-2">
                {completion.checks.map((item) => <li key={item.label}><button type="button" disabled={busy} onClick={() => onEdit(item.key)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-xs hover:bg-soft-green disabled:opacity-60"><span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${item.complete ? "bg-soft-green text-forest" : "border border-line text-muted"}`}>{item.complete ? <Check className="size-3" aria-hidden="true" /> : <span aria-hidden="true">·</span>}</span><span>{item.label}</span><span className="sr-only">{item.complete ? ": lengkap" : ": belum lengkap"}</span></button></li>)}
              </ul>
              <p className="mt-3 text-xs leading-6 text-muted">Panduan kelengkapan informasi, bukan skor backend atau syarat penerbitan.</p>
            </div>
          </Card>
          <Card className="min-w-0 gap-0 rounded-xl border-line/60 p-5 shadow-none sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-forest">Lanjutkan mengelola</h2>
            <p className="mt-2 text-xs leading-6 text-muted">{profile.status === "published" ? "Profil sudah tampil di publik. Jaga informasi bisnismu tetap relevan." : "Profil masih berupa draft dan hanya terlihat olehmu. Terbitkan melalui daftar profil saat sudah siap."}</p>
            <div className="mt-4 space-y-1">
              {[{ label: "Edit informasi bisnis", icon: Pencil, section: "identity" }, { label: "Cerita usaha", icon: BookOpen, section: "story" }, { label: "Business Model Canvas", icon: PanelsTopLeft, section: "canvas" }].map((item) => <Button key={item.label} variant="ghost" disabled={busy} onClick={() => onEdit(item.section as EditorSection)} className="min-h-11 w-full justify-start rounded-lg px-2 text-sm text-forest hover:bg-soft-green"><item.icon />{item.label}<ArrowUpRight className="ml-auto" /></Button>)}
            </div>
            <button type="button" onClick={onSaved} className="mt-4 flex min-h-11 w-full items-center justify-between gap-2 border-t border-line/50 pt-3 text-left text-xs font-medium text-forest">Lihat profil tersimpan<ArrowUpRight className="size-4" aria-hidden="true" /></button>
          </Card>
        </div>
      ) : (
        <Card className="gap-3 rounded-xl border-line/60 p-5 shadow-none"><h2 className="text-lg font-semibold text-forest">Pilih profil untuk dikelola</h2><p className="text-sm text-muted">Tidak ada profil pada halaman ini. Muat kembali daftar profil untuk melanjutkan.</p><Button variant="outline" disabled={busy} onClick={onRetry} className="min-h-11 w-fit border-line px-4 text-forest">Coba lagi</Button></Card>
      )}
    </motion.section>
  );
}
