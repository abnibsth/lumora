"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_CATEGORIES, type AIDraftProfile } from "@/types/business";
import type { EditorSection, ProfileForm } from "@/lib/dashboard";
import { uploadMediaApi } from "@/lib/api";
import { AIDraftPanel } from "./ai-draft-panel";
import { CanvasEditor, MilestoneEditor } from "./structured-editors";

const sections: { id: EditorSection; label: string }[] = [{ id: "identity", label: "Identitas" }, { id: "story", label: "Cerita usaha" }, { id: "owner", label: "Pemilik" }, { id: "media", label: "Gambar" }, { id: "canvas", label: "Model bisnis" }, { id: "partners", label: "Mitra" }, { id: "ai", label: "Lumora AI" }];
const field = "mt-2 min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm";
const area = `${field} min-h-32 py-3 leading-7`;

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) { return <div><Label htmlFor={id} className="text-sm text-forest">{label}</Label>{children}</div>; }

export function BusinessEditor({ form, section, editingName, dirty, saving, emailVerified, onChange, onSection, onApply, onSubmit, onCancel, onSessionExpired, onBusyChange }: {
  form: ProfileForm; section: EditorSection; editingName?: string; dirty: boolean; saving: boolean; emailVerified: boolean;
  onChange: (form: ProfileForm) => void; onSection: (section: EditorSection) => void; onApply: (draft: AIDraftProfile) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; onSessionExpired: () => void; onBusyChange: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState<"coverImage" | "logo" | null>(null);
  const [aiBusy, setAIBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const disabled = saving || uploading !== null || aiBusy;
  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) { onChange({ ...form, [key]: value }); }
  async function upload(key: "coverImage" | "logo", file?: File) {
    if (!file || disabled) return;
    setUploading(key); onBusyChange(true); setUploadMessage("Mengunggah gambar...");
    const result = await uploadMediaApi(file);
    setUploading(null); onBusyChange(false);
    if (!result.ok || !result.url) {
      if (result.code === "unauthenticated") return onSessionExpired();
      setUploadMessage(result.error || "Gambar gagal diunggah."); return;
    }
    set(key, result.url); setUploadMessage("Gambar siap. Simpan profil untuk menerapkan perubahan.");
  }
  function validateAndSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = Array.from(event.currentTarget.elements).find((element) => element instanceof HTMLElement && "checkValidity" in element && !(element as HTMLInputElement).checkValidity()) as HTMLInputElement | undefined;
    if (invalid) {
      const targetSection = invalid.closest<HTMLElement>("[data-editor-section]")?.dataset.editorSection as EditorSection | undefined;
      if (targetSection) onSection(targetSection);
      requestAnimationFrame(() => { invalid.focus(); invalid.reportValidity(); });
      return;
    }
    onSubmit(event);
  }
  return <Card className="mb-8 gap-0 border-line p-5 shadow-none sm:p-7" aria-labelledby="business-form-heading">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium text-accent">{editingName ? "Edit profil" : "Draft baru"}</p><h2 id="business-form-heading" className="mt-2 break-words text-xl font-semibold text-forest">{editingName || "Susun profil usahamu"}</h2><p className="mt-2 text-xs text-muted">{dirty ? "Ada perubahan yang belum disimpan." : "Perubahan baru tersimpan setelah kamu menekan Simpan."}</p></div><Button type="button" variant="ghost" disabled={disabled} onClick={onCancel} className="min-h-11 px-3 text-forest">Tutup editor</Button></div>
    <div className="my-6 flex flex-wrap gap-2 border-b border-line pb-4" role="group" aria-label="Bagian editor profil">{sections.map((item) => <Button key={item.id} type="button" variant="ghost" aria-pressed={section === item.id} aria-controls={`editor-${item.id}`} onClick={() => onSection(item.id)} className={`min-h-11 px-3 text-xs ${section === item.id ? "bg-forest text-white hover:bg-deep-forest" : "bg-ivory text-forest hover:bg-soft-green"}`}>{item.label}</Button>)}</div>
    <form noValidate onSubmit={validateAndSubmit} className="space-y-6">
      <fieldset disabled={disabled} hidden={section !== "identity"} id="editor-identity" data-editor-section="identity" className="space-y-5"><legend className="sr-only">Identitas usaha</legend>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Nama bisnis" id="business-name"><Input id="business-name" required maxLength={100} value={form.name} onChange={(event) => set("name", event.target.value)} className={field} /></Field><Field label="Kategori" id="business-category"><select id="business-category" value={form.category} onChange={(event) => set("category", event.target.value as ProfileForm["category"])} className={field}>{BUSINESS_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Lokasi" id="business-location"><Input id="business-location" required maxLength={200} value={form.location} onChange={(event) => set("location", event.target.value)} className={field} /></Field><Field label="Tahun berdiri" id="business-year"><Input id="business-year" type="number" required min={1900} max={2100} value={form.foundedYear} onChange={(event) => set("foundedYear", event.target.value)} className={field} /></Field></div>
        <Field label="Deskripsi singkat" id="business-description"><textarea id="business-description" required maxLength={5000} value={form.description} onChange={(event) => set("description", event.target.value)} className={area} /></Field>
      </fieldset>
      <fieldset disabled={disabled} hidden={section !== "story"} id="editor-story" data-editor-section="story" className="space-y-6"><legend className="sr-only">Cerita usaha</legend><Field label="Cerita bisnis" id="business-story"><textarea id="business-story" required maxLength={5000} value={form.story} onChange={(event) => set("story", event.target.value)} className={`${area} min-h-56`} /></Field><MilestoneEditor items={form.milestones} disabled={disabled} onChange={(items) => set("milestones", items)} /></fieldset>
      <fieldset disabled={disabled} hidden={section !== "owner"} id="editor-owner" data-editor-section="owner" className="space-y-5"><legend className="sr-only">Pemilik usaha</legend><div className="grid gap-5 sm:grid-cols-2"><Field label="Nama pemilik" id="owner-name"><Input id="owner-name" required maxLength={100} value={form.ownerName} onChange={(event) => set("ownerName", event.target.value)} className={field} /></Field><Field label="Peran" id="owner-role"><Input id="owner-role" required maxLength={100} value={form.ownerRole} onChange={(event) => set("ownerRole", event.target.value)} className={field} placeholder="Contoh: Pendiri" /></Field></div><Field label="Bio pemilik" id="owner-bio"><textarea id="owner-bio" required maxLength={1000} value={form.ownerBio} onChange={(event) => set("ownerBio", event.target.value)} className={area} /></Field></fieldset>
      <fieldset disabled={saving || aiBusy} hidden={section !== "media"} id="editor-media" data-editor-section="media" className="space-y-5"><legend className="sr-only">Media usaha</legend>{(["coverImage", "logo"] as const).map((key) => <div key={key}><Field label={key === "logo" ? "Logo bisnis" : "Gambar cover"} id={`upload-${key}`}><Input id={`upload-${key}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled} onChange={(event) => upload(key, event.target.files?.[0])} className={`${field} py-2 file:mr-3 file:text-xs`} /></Field><p className="mt-2 text-xs text-muted">JPEG, PNG, WebP, GIF · maksimal 5 MB</p>{form[key] ? <div className="mt-3 rounded-lg bg-ivory p-3"><p className="break-all text-xs text-muted">{form[key]}</p><Button type="button" variant="ghost" disabled={disabled} onClick={() => set(key, "")} className="mt-2 min-h-11 text-red-700">Hapus {key === "logo" ? "logo" : "cover"}</Button></div> : null}</div>)}{uploadMessage ? <p role="status" className="text-sm text-muted">{uploadMessage}</p> : null}</fieldset>
      <div hidden={section !== "canvas"} id="editor-canvas" data-editor-section="canvas"><CanvasEditor items={form.bmc} disabled={disabled} onChange={(items) => set("bmc", items)} /></div>
      <fieldset disabled={disabled} hidden={section !== "partners"} id="editor-partners" data-editor-section="partners" className="space-y-5"><legend className="sr-only">Kebutuhan mitra</legend><Field label="Kebutuhan mitra (pisahkan dengan koma)" id="business-seeking"><Input id="business-seeking" value={form.seeking} onChange={(event) => set("seeking", event.target.value)} placeholder="Mitra distribusi, Mitra ekspansi" className={field} /></Field><Field label="Tujuan mencari mitra (opsional)" id="business-objective"><textarea id="business-objective" maxLength={500} value={form.seekingObjective} onChange={(event) => set("seekingObjective", event.target.value)} className={area} /></Field></fieldset>
      <div hidden={section !== "ai"} id="editor-ai" data-editor-section="ai"><AIDraftPanel emailVerified={emailVerified} disabled={saving || uploading !== null} onApply={onApply} onSessionExpired={onSessionExpired} onBusyChange={(busy) => { setAIBusy(busy); onBusyChange(busy); }} /></div>
      <div className="flex flex-wrap gap-3 border-t border-line pt-5"><Button type="submit" disabled={disabled} className="min-h-11 bg-forest px-5 text-white hover:bg-deep-forest">{saving ? "Menyimpan..." : editingName ? "Simpan perubahan" : "Simpan draft"}</Button><Button type="button" variant="outline" onClick={onCancel} disabled={disabled} className="min-h-11 border-line px-4 text-forest">Batal</Button><p className="w-full text-xs leading-6 text-muted">Identitas, deskripsi, cerita, dan informasi pemilik wajib diisi untuk menyimpan draft.</p></div>
    </form>
  </Card>;
}
