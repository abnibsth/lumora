"use client";

import { BMC_LABELS } from "@/lib/dashboard";
import type { BmcEntry } from "@/types/business";
import { Label } from "@/components/ui/label";
import { CanvasEditor } from "./structured-editors";

export function NineBlockCanvas({ items, disabled, onChange }: { items: BmcEntry[]; disabled: boolean; onChange: (items: BmcEntry[]) => void }) {
  function update(label: string, value: string) {
    const index = items.findIndex((item) => item.label.trim().toLowerCase() === label.toLowerCase());
    if (index < 0) { if (value.trim()) onChange([...items, { label, value }]); }
    else onChange(value.trim() ? items.map((item, i) => i === index ? { ...item, value } : item) : items.filter((_, i) => i !== index));
  }
  return <div className="space-y-6"><p className="text-xs leading-6 text-muted">Sembilan blok standar. Slot kosong belum menjadi data tersimpan; isi blok yang relevan. Data khusus dan label berulang tetap ada di editor lanjutan.</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{BMC_LABELS.map((label, i) => {
    const matches = items.filter((item) => item.label.trim().toLowerCase() === label.toLowerCase());
    return <div key={label} className="rounded-lg border border-line bg-ivory/50 p-4"><Label htmlFor={`canvas-slot-${i}`} className="text-sm text-forest">{label}</Label>{matches.length > 1 ? <p className="mt-3 text-xs leading-6 text-muted">Ada {matches.length} blok dengan label ini. Edit masing-masing di editor lanjutan; tidak digabung otomatis.</p> : <textarea id={`canvas-slot-${i}`} maxLength={1000} disabled={disabled || (matches.length === 0 && items.length >= 30)} value={matches[0]?.value || ""} onChange={(event) => update(label, event.target.value)} className="mt-3 min-h-32 w-full rounded-lg border border-line-strong bg-surface p-3 text-sm leading-6 disabled:opacity-60" />}</div>;
  })}</div><details className="rounded-lg border border-line p-4"><summary className="min-h-11 cursor-pointer text-sm font-medium text-forest">Blok khusus & editor lanjutan ({items.length} blok tersimpan/diedit)</summary><div className="mt-4"><CanvasEditor items={items} disabled={disabled} onChange={onChange} /></div></details></div>;
}
