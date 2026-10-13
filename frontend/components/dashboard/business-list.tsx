"use client";

import { useId } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Store, MapPin, ArrowUpRight, Plus, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completionFor } from "@/lib/dashboard";
import type { OwnedBusiness } from "@/types/business";

export function BusinessList({ businesses, total, page, busy, error, onPageChange, onRetry, onCreate, onEdit, onPublish, onArchive, preview = false }: {
  businesses: OwnedBusiness[]; total: number; page: number; busy: boolean; error?: string;
  onPageChange: (page: number) => void; onRetry: () => void; onCreate: () => void;
  onEdit: (business: OwnedBusiness) => void; onPublish: (business: OwnedBusiness) => void; onArchive: (business: OwnedBusiness) => void; preview?: boolean;
}) {
  const headingId = useId();
  const reduced = useReducedMotion();
  const items = preview ? businesses.slice(0, 3) : businesses;
  return <section aria-labelledby={headingId} className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id={headingId} className="text-xl font-semibold tracking-tight text-forest">Profil bisnismu</h2><p className="mt-1 text-sm text-muted">Kelola draft dan profil yang sudah terbit.</p></div>{!preview && total > 0 ? <Button variant="ghost" onClick={onCreate} className="min-h-11 rounded-lg px-3 text-forest hover:bg-soft-green" disabled={busy}><Plus />Tambah profil</Button> : null}</div>
    {error ? <Card className="gap-3 border-line/60 p-6 shadow-none" role="alert"><p className="text-sm text-red-700">{error}</p><Button onClick={onRetry} disabled={busy} className="min-h-11 w-fit bg-forest px-4 text-white">Coba lagi</Button></Card> : total === 0 ? <Card className="items-start gap-0 border-line/60 p-6 shadow-none sm:p-8">
      <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-soft-green text-forest"><Store aria-hidden="true" className="size-6" /></span><h3 className="text-xl font-semibold text-forest">Mulai dari cerita usahamu.</h3><p className="mt-3 max-w-lg text-sm leading-7 text-muted">Belum ada profil bisnis. Susun informasi usaha sebagai draft, lalu terbitkan saat sudah siap. Draft hanya terlihat olehmu.</p><Button onClick={onCreate} disabled={busy} className="mt-6 min-h-11 bg-lime px-5 text-forest hover:bg-lime/80"><Plus />Buat draft pertama</Button>
    </Card> : <div className="space-y-3" aria-busy={busy}>{items.map((business) => <motion.article key={business.id} whileHover={reduced ? undefined : { y: -2 }} transition={{ duration: .15 }}>
      <Card className="gap-4 rounded-xl border-line/60 p-5 shadow-none sm:p-6">
        <div className="flex items-start gap-4"><div className="hidden size-12 shrink-0 items-center justify-center rounded-lg border border-line/60 bg-ivory text-lg font-semibold text-forest sm:flex" aria-hidden="true">{business.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-lg font-semibold text-forest">{business.name}</h3><Badge className={`border-0 ${business.status === "published" ? "bg-soft-green text-forest" : "bg-ivory text-muted"}`}>{business.status === "published" ? "Terbit" : "Draft"}</Badge></div><p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted"><span>{business.category}</span><span aria-hidden="true">·</span><MapPin className="size-3" aria-hidden="true" /><span>{business.location}</span><span>· Berdiri {business.foundedYear}</span></p><p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-muted">{business.description}</p></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4"><p className="text-xs text-muted">Checklist kelengkapan <span className="font-semibold text-forest">{completionFor(business)?.percent}%</span></p><div className="flex flex-wrap gap-2">
          {business.status === "published" ? <Button asChild variant="ghost" className="min-h-11 px-3 text-forest hover:bg-soft-green"><Link href={`/business/${encodeURIComponent(business.slug)}`}>Lihat profil<ArrowUpRight /></Link></Button> : null}
          <Button variant="outline" disabled={busy} onClick={() => onEdit(business)} className="min-h-11 border-line/60 bg-surface px-3 text-forest hover:bg-soft-green"><Pencil />Edit</Button>
          {business.status === "draft" ? <Button variant={preview ? "outline" : "default"} disabled={busy} onClick={() => onPublish(business)} className={`min-h-11 rounded-lg px-4 ${preview ? "border-line/60 bg-surface text-forest hover:bg-soft-green" : "bg-forest text-white hover:bg-deep-forest"}`}>Terbitkan</Button> : null}
          <Button variant="ghost" disabled={busy} onClick={() => onArchive(business)} className="min-h-11 px-3 text-red-700 hover:bg-red-50">Arsipkan</Button>
        </div></div>
      </Card>
    </motion.article>)}</div>}
    {!preview && !error && total > 50 ? <nav aria-label="Halaman profil bisnis" className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Halaman {page} dari {Math.ceil(total / 50)} · {total} profil</p><div className="flex gap-2"><Button variant="outline" className="min-h-11 border-line/60 px-4" disabled={busy || page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</Button><Button variant="outline" className="min-h-11 border-line/60 px-4" disabled={busy || page * 50 >= total} onClick={() => onPageChange(page + 1)}>Berikutnya</Button></div></nav> : null}
  </section>;
}
