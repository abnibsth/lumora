"use client";

import { ArrowRight, FilePlus2, ImagePlus, BookOpen, Send } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  { title: "Buat profil bisnis", description: "Isi identitas, deskripsi, cerita, dan data pemilik untuk menyimpan draft pertama.", icon: FilePlus2 },
  { title: "Lengkapi informasi dan foto", description: "Setelah draft tersimpan, tambahkan cover, logo, dan informasi usaha melalui editor profil.", icon: ImagePlus },
  { title: "Tambahkan cerita usaha", description: "Ceritakan perjalanan bisnis dan catat momen penting di bagian Cerita Usaha.", icon: BookOpen },
  { title: "Publikasikan profil", description: "Periksa profil dan verifikasi email, lalu gunakan Terbitkan agar bisnis terlihat oleh calon mitra.", icon: Send },
];

export function DashboardOnboarding({ onCreate, busy }: { onCreate: () => void; busy: boolean }) {
  return <Card className="gap-0 rounded-xl border-line/60 p-5 shadow-none sm:p-6">
    <div className="max-w-2xl"><p className="text-xs font-medium text-accent">Mulai di sini</p><h2 className="mt-2 text-lg font-semibold tracking-tight text-forest">Siapkan profil pertama usahamu</h2><p className="mt-2 text-sm leading-6 text-muted">Empat langkah untuk membantu calon mitra mengenal bisnismu. Mulai dengan draft yang hanya terlihat olehmu.</p></div>
    <ol className="mt-5 grid gap-x-6 sm:grid-cols-2">
      {steps.map((step, index) => <li key={step.title} className="flex gap-3 border-t border-line/50 py-4">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${index === 0 ? "bg-lime text-forest" : "bg-ivory text-muted"}`} aria-hidden="true"><step.icon className="size-4" /></span>
        <div className="min-w-0"><span className="text-xs text-muted">Langkah {index + 1}</span><h3 className="mt-1 text-sm font-semibold text-forest">{step.title}</h3><p className="mt-2 text-xs leading-6 text-muted">{step.description}</p>{index === 0 ? <button type="button" onClick={() => { if (!busy) onCreate(); }} aria-disabled={busy} className="mt-1 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-forest underline underline-offset-4">Mulai menyusun draft<ArrowRight className="size-3" aria-hidden="true" /></button> : <p className="mt-2 text-xs text-muted">Tersedia setelah profil dibuat.</p>}</div>
      </li>)}
    </ol>
    <p className="border-t border-line/50 pt-4 text-xs leading-6 text-muted">Tidak ada progres yang ditandai sebelum profil dibuat. Publikasi saat ini langsung menerbitkan profil; belum ada proses pengajuan review.</p>
  </Card>;
}
