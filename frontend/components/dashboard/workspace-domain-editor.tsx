"use client";

import type { FormEvent } from "react";
import type { AIDraftProfile } from "@/types/business";
import type { ProfileForm } from "@/lib/dashboard";
import type { ProfileError } from "@/lib/profile-management";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileSteps } from "./profile-steps";
import { AIDraftPanel } from "./ai-draft-panel";
import { NineBlockCanvas } from "./nine-block-canvas";

export function WorkspaceDomainEditor({ view, form, disabled, dirty, creating, emailVerified, onChange, onSubmit, onPreview, onApply, onBusyChange, onSessionExpired, errors = [] }: {
  view: "story" | "canvas" | "saved" | "ai"; form: ProfileForm; disabled: boolean; dirty: boolean; creating: boolean; emailVerified: boolean; errors?: ProfileError[];
  onChange: (form: ProfileForm) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onPreview: () => void; onApply: (draft: AIDraftProfile) => void; onBusyChange: (busy: boolean) => void; onSessionExpired: () => void;
}) {
  const label = view === "story" ? "cerita usaha" : view === "canvas" ? "model bisnis" : "kebutuhan kerja sama";
  return <Card className="gap-5 border-line/60 p-5 shadow-none sm:p-6"><p className="text-xs leading-6 text-muted">{creating ? "Draft baru — belum tersimpan di server. Simpan pertama memerlukan data inti Profil Bisnis dan cerita." : dirty ? "Ada perubahan belum disimpan pada bisnis ini. Simpan halaman ini tidak membuang perubahan halaman lain." : "Data terhubung ke profil bisnis yang dipilih."}</p>
    {view === "ai" ? <><AIDraftPanel emailVerified={emailVerified} disabled={disabled} onApply={onApply} onSessionExpired={onSessionExpired} onBusyChange={onBusyChange} /><p className="text-xs leading-6 text-muted">Hasil AI belum disimpan. Tinjau setiap bagian melalui Profil Bisnis, Cerita Usaha, BMC, dan Peluang & Mitra.</p></> : <form noValidate onSubmit={onSubmit} className="space-y-5"><fieldset disabled={disabled} className="min-w-0"><legend className="sr-only">Editor {label}</legend>{view === "canvas" ? <NineBlockCanvas items={form.bmc} disabled={disabled} onChange={(bmc) => onChange({ ...form, bmc })} /> : <ProfileSteps form={form} step={view === "story" ? 4 : 5} errors={errors} disabled={disabled} onChange={onChange} />}</fieldset>
      {view === "story" && form.milestones.length ? <section className="border-t border-line pt-4"><h2 className="text-base font-semibold text-forest">Preview perjalanan usaha</h2><ol className="mt-3 grid gap-3 sm:grid-cols-2">{form.milestones.map((item, index) => <li key={index} className="border-l-2 border-lime pl-3"><p className="text-xs text-accent">{item.year || "Tahun belum diisi"}</p><p className="mt-1 break-words text-sm font-medium text-forest">{item.title || "Judul belum diisi"}</p><p className="mt-2 break-words text-xs leading-6 text-muted">{item.description}</p></li>)}</ol></section> : null}
      <div className="flex flex-wrap gap-3 border-t border-line/60 pt-4"><Button type="submit" disabled={disabled} className="min-h-11 bg-forest px-4 text-white">{disabled ? "Memproses..." : creating ? "Simpan draft pertama" : `Simpan ${label}`}</Button><Button type="button" disabled={disabled} variant="outline" onClick={onPreview} className="min-h-11 border-line px-4 text-forest">{view === "story" ? "Preview cerita usaha" : "Preview profil"}</Button></div>
    </form>}
    {view === "saved" ? <section className="rounded-lg bg-ivory p-4"><h2 className="text-sm font-semibold text-forest">Listing peluang & pencocokan mitra</h2><p className="mt-2 text-xs leading-6 text-muted">Belum tersedia. Kebutuhan kerja sama tersimpan pada profil bisnis; belum ada listing peluang atau matching otomatis.</p></section> : null}
  </Card>;
}
