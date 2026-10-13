"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { draftProfileApi } from "@/lib/api";
import type { AIDraftProfile } from "@/types/business";

export function AIDraftPanel({ emailVerified, disabled, onApply, onSessionExpired, onBusyChange }: { emailVerified: boolean; disabled: boolean; onApply: (draft: AIDraftProfile) => void; onSessionExpired: () => void; onBusyChange: (busy: boolean) => void }) {
  const [narrative, setNarrative] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  async function generate() {
    if (drafting || disabled) return;
    setDrafting(true); onBusyChange(true); setMessage(null);
    const result = await draftProfileApi(narrative);
    setDrafting(false); onBusyChange(false);
    if (!result.ok || !result.draft) {
      if (result.code === "unauthenticated") return onSessionExpired();
      setMessage(result.code === "email_not_verified" ? "Verifikasi email sebelum menggunakan draft AI." : result.code === "rate_limited" ? "Batas penggunaan AI tercapai. Tunggu sebelum mencoba lagi." : result.code === "ai_unavailable" ? "Layanan AI belum tersedia. Coba lagi nanti." : result.error || "Draft AI gagal dibuat.");
      return;
    }
    onApply(result.draft); setSuggestions(result.draft.suggestions);
    setMessage("Hasil AI dimasukkan ke form. Periksa informasi, cerita, dan model bisnis sebelum menyimpan. Belum ada data yang disimpan.");
  }
  return <div className="space-y-5"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-lime text-forest"><Sparkles className="size-5" /></span><div><h3 className="font-semibold text-forest">Susun draft dari cerita usahamu</h3><p className="mt-2 text-sm leading-6 text-muted">Tulis fakta tentang usaha dalam 20–5000 karakter. AI membantu menyusun informasi, bukan menggantikan pemeriksaanmu. Hasil baru disimpan setelah kamu menekan Simpan draft.</p></div></div>
    <div><Label htmlFor="ai-narrative" className="text-sm text-forest">Fakta dan cerita usaha</Label><textarea id="ai-narrative" value={narrative} maxLength={5000} disabled={disabled || drafting || !emailVerified} onChange={(event) => setNarrative(event.target.value)} placeholder="Ceritakan produk, pelanggan, lokasi, tahun berdiri, dan perjalanan usahamu..." className="mt-2 min-h-48 w-full rounded-lg border border-line-strong bg-surface p-4 text-sm leading-7 disabled:opacity-60" /><p className="mt-2 text-xs text-muted">{narrative.length}/5000 karakter · minimal 20 karakter</p></div>
    {!emailVerified ? <p className="text-sm text-red-700">Verifikasi email untuk menggunakan Lumora AI.</p> : null}
    <Button type="button" disabled={disabled || drafting || !emailVerified || narrative.trim().length < 20} onClick={generate} className="min-h-11 bg-forest px-4 text-white hover:bg-deep-forest"><Sparkles />{drafting ? "Menyusun draft..." : "Isi form dengan AI"}</Button>
    {message ? <p role="status" className="rounded-lg border border-line bg-ivory p-4 text-sm leading-6 text-forest">{message}</p> : null}
    {suggestions.length ? <div><h4 className="text-sm font-semibold text-forest">Informasi yang perlu dilengkapi</h4><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">{suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul></div> : null}
  </div>;
}
