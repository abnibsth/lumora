"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadMediaApi } from "@/lib/api";
import { safeMediaUrl } from "@/lib/profile-management";
import type { ProfileForm } from "@/lib/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnavailableFields } from "./profile-fields";

export function ProfileImage({ src, alt, className, contain = false }: { src?: string; alt: string; className?: string; contain?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const safe = safeMediaUrl(src);
  return <div className={`relative overflow-hidden rounded-lg bg-ivory ${className || ""}`}>{safe && failedSrc !== safe ? <Image src={safe} alt={alt} fill unoptimized className={contain ? "object-contain p-1" : "object-cover"} onError={() => setFailedSrc(safe)} /> : <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted">{contain ? "Belum ada logo" : "Belum ada cover"}</div>}</div>;
}

export function ProfileMediaStep({ form, disabled, onChange, onBusyChange, onSessionExpired }: { form: ProfileForm; disabled: boolean; onChange: (form: ProfileForm) => void; onBusyChange: (busy: boolean) => void; onSessionExpired: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function upload(key: "logo" | "coverImage", file?: File) {
    if (!file || disabled || uploading) return;
    if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) { setMessage("Pilih JPEG, PNG, WebP, atau GIF berukuran maksimal 5 MB."); return; }
    setUploading(true); onBusyChange(true); setMessage("Mengunggah gambar...");
    const result = await uploadMediaApi(file);
    setUploading(false); onBusyChange(false);
    if (!result.ok || !result.url) { if (result.code === "unauthenticated") return onSessionExpired(); setMessage(result.error || "Gambar gagal diunggah."); return; }
    onChange({ ...form, [key]: result.url });
    setMessage("Upload berhasil. Simpan draft untuk menghubungkan gambar ini ke profil.");
  }
  return <div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2">{(["logo", "coverImage"] as const).map((key) => <div key={key}><Label htmlFor={`profile-upload-${key}`}>{key === "logo" ? "Logo usaha" : "Foto cover"}</Label><ProfileImage src={form[key]} alt={key === "logo" ? "Logo usaha" : "Cover usaha"} contain={key === "logo"} className="mt-3 aspect-[4/3] border border-line/60" /><Input id={`profile-upload-${key}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled || uploading} onChange={(event) => { void upload(key, event.target.files?.[0]); event.target.value = ""; }} className="mt-3 min-h-11 border-line py-2 file:mr-2 file:text-xs" /><p className="mt-2 text-xs text-muted">JPEG, PNG, WebP, GIF · maksimal 5 MB</p>{form[key] ? <Button type="button" variant="ghost" disabled={disabled || uploading} onClick={() => onChange({ ...form, [key]: "" })} className="mt-2 min-h-11 text-red-700">Hapus {key === "logo" ? "logo" : "cover"} dari profil</Button> : null}</div>)}</div>{message ? <p role="status" className="text-sm leading-6 text-forest">{message}</p> : null}<UnavailableFields labels={["Galeri foto bisnis"]} reason="Backend baru mendukung satu logo dan satu cover. Galeri belum dapat disimpan sebagai bagian profil." /><p className="text-xs leading-6 text-muted">Profil draft tidak tampil di publik. Namun URL file upload dapat diakses jika diketahui; jangan unggah dokumen atau foto sensitif.</p></div>;
}
