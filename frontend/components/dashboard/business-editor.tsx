"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EditorSection, ProfileForm } from "@/lib/dashboard";
import { PROFILE_STEPS, SECTION_FOR_STEP, stepForSection, validateProfile, type ProfileError } from "@/lib/profile-management";
import { ProfileStepper } from "./profile-stepper";
import { ProfileSteps } from "./profile-steps";
import { ProfileMediaStep } from "./profile-media-step";

export function BusinessEditor({ form, section, editingName, dirty, saving, onChange, onSection, onSubmit, onCancel, onSessionExpired, onBusyChange, onPreview, onWorkspace, validationErrors = [] }: {
  form: ProfileForm; section: EditorSection; editingName?: string; dirty: boolean; saving: boolean; validationErrors?: ProfileError[];
  onChange: (form: ProfileForm) => void; onSection: (section: EditorSection) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; onSessionExpired: () => void; onBusyChange: (busy: boolean) => void; onPreview: () => void; onWorkspace: (view: "story" | "canvas" | "ai") => void;
}) {
  const [uploadBusy, setUploadBusy] = useState(false);
  const [errors, setErrors] = useState<ProfileError[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const disabled = saving || uploadBusy;
  const step = Math.min(stepForSection(section), 3);
  function go(next: number) { onSection(SECTION_FOR_STEP[next]); requestAnimationFrame(() => panelRef.current?.focus()); }
  function next() {
    const issues = validateProfile(form, step); setErrors(issues);
    if (issues.length) requestAnimationFrame(() => document.getElementById(`profile-${issues[0].field}`)?.focus()); else go(step + 1);
  }
  function update(nextForm: ProfileForm) { onChange(nextForm); if (errors.length) setErrors(validateProfile(nextForm).filter((error) => error.step < 4)); }
  return <Card className="mb-6 gap-0 border-line/60 p-5 shadow-none sm:p-6" aria-labelledby="business-form-heading">
    <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-medium text-accent">{editingName ? "Edit profil" : "Draft baru"}</p><h2 id="business-form-heading" className="mt-2 break-words text-xl font-semibold text-forest">{editingName || "Susun profil usahamu"}</h2><p className="mt-2 text-xs text-muted">{dirty ? "Ada perubahan yang belum disimpan." : "Kelola identitas dan informasi utama usaha."}</p></div><Button disabled={disabled} variant="ghost" onClick={onCancel} className="min-h-11 text-forest">Tutup editor</Button></div>
    <ProfileStepper step={step} busy={disabled} onStep={go} />
    <div className="mb-4 flex flex-wrap gap-2"><Button disabled={disabled} variant="outline" onClick={onPreview} className="min-h-11 border-line text-forest">Preview Profil</Button><Button disabled={disabled} variant="ghost" onClick={() => onWorkspace("ai")} className="min-h-11 text-forest">Buka Lumora AI</Button><Button disabled={disabled} variant="ghost" onClick={() => onWorkspace("canvas")} className="min-h-11 text-forest">Buka BMC</Button></div>
    {errors.length ? <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{errors.map((error) => <p key={error.field}>{error.message}</p>)}</div> : null}
    <form noValidate onSubmit={onSubmit} className="space-y-5"><div ref={panelRef} tabIndex={-1} aria-label={PROFILE_STEPS[step]} className="outline-none"><fieldset disabled={disabled} hidden={step === 2} className="min-w-0"><legend className="sr-only">{PROFILE_STEPS[step]}</legend><ProfileSteps form={form} step={step} errors={[...errors, ...validationErrors]} disabled={disabled} onChange={update} /></fieldset><div hidden={step !== 2}><ProfileMediaStep form={form} disabled={saving} onChange={update} onBusyChange={(busy) => { setUploadBusy(busy); onBusyChange(busy); }} onSessionExpired={onSessionExpired} /></div></div>
      {!editingName && !form.story.trim() ? <div className="rounded-lg border border-line bg-ivory p-4"><p className="text-xs leading-6 text-muted">Backend membutuhkan cerita usaha untuk simpan pertama. Isi di halaman Cerita Usaha; data empat langkah ini tetap terjaga saat berpindah.</p><Button type="button" disabled={disabled} variant="link" onClick={() => onWorkspace("story")} className="min-h-11 px-0 text-forest">Lengkapi di Cerita Usaha</Button></div> : null}
      <div className="flex flex-wrap justify-between gap-3 border-t border-line/60 pt-5"><div className="flex gap-2"><Button type="button" variant="outline" disabled={disabled || step === 0} onClick={() => go(step - 1)} className="min-h-11 border-line text-forest">Kembali</Button>{step < 3 ? <Button type="button" variant="outline" disabled={disabled} onClick={next} className="min-h-11 border-line text-forest">Lanjut</Button> : null}</div><Button type="submit" disabled={disabled} className="min-h-11 bg-forest px-5 text-white">{saving ? "Menyimpan..." : editingName ? "Simpan perubahan profil" : "Simpan draft"}</Button></div>
    </form>
  </Card>;
}
