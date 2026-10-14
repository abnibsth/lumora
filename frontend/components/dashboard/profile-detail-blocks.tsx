"use client";

import type { BmcEntry } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const labels = ["Produk/Jasa Utama", "Segmen Pelanggan", "Proposisi Nilai"];
export function ProfileDetailBlocks({ items, disabled, onChange }: { items: BmcEntry[]; disabled: boolean; onChange: (items: BmcEntry[]) => void }) {
  return <div className="space-y-4">{labels.map((label) => {
    const matches = items.map((item, index) => ({ ...item, index })).filter((item) => item.label.trim().toLowerCase() === label.toLowerCase());
    return <section key={label} className="rounded-lg border border-line p-4"><h3 className="text-sm font-semibold text-forest">{label}</h3>{matches.length ? matches.map((item) => <div key={item.index} className="mt-3"><Label htmlFor={`bmc-value-${item.index}`} className="sr-only">{label}, blok {item.index + 1}</Label><textarea id={`bmc-value-${item.index}`} disabled={disabled} maxLength={1000} value={item.value} onChange={(event) => onChange(items.map((entry, i) => i === item.index ? { ...entry, value: event.target.value } : entry))} className="min-h-28 w-full rounded-lg border border-line-strong bg-surface p-3 text-sm leading-6" /></div>) : <Button type="button" variant="outline" disabled={disabled || items.length >= 30} onClick={() => onChange([...items, { label, value: "" }])} className="mt-3 min-h-11 border-line text-xs text-forest">Tambahkan {label}</Button>}</section>;
  })}<p className="text-xs leading-6 text-muted">Detail ini memakai data BMC yang sama. Blok lain dan label khusus tetap utuh; kelola sembilan blok di menu Business Model Canvas.</p></div>;
}
