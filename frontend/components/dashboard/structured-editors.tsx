"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BMC_LABELS } from "@/lib/dashboard";
import type { BmcEntry, BusinessMilestone } from "@/types/business";

const field = "mt-2 min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm";

export function MilestoneEditor({ items, onChange, disabled }: { items: BusinessMilestone[]; onChange: (items: BusinessMilestone[]) => void; disabled: boolean }) {
  function update(index: number, patch: Partial<BusinessMilestone>) { onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  return <div className="space-y-4 border-t border-line pt-6"><div><h3 className="text-base font-semibold text-forest">Perjalanan usaha</h3><p className="mt-2 text-sm text-muted">Catat momen penting usahamu. Maksimal 50 milestone.</p></div>
    {items.map((item, index) => <fieldset key={index} disabled={disabled} className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-[7rem_1fr_auto]"><legend className="px-2 text-xs text-muted">Milestone {index + 1}</legend><div><Label htmlFor={`milestone-year-${index}`}>Tahun</Label><Input id={`milestone-year-${index}`} type="number" required min={1900} max={2100} value={item.year || ""} onChange={(event) => update(index, { year: Number(event.target.value) })} className={field} /></div><div><Label htmlFor={`milestone-title-${index}`}>Momen penting</Label><Input id={`milestone-title-${index}`} required maxLength={150} value={item.title} onChange={(event) => update(index, { title: event.target.value })} className={field} /></div><Button type="button" variant="ghost" aria-label={`Hapus milestone ${index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))} className="min-h-11 self-end text-red-700"><Trash2 /></Button><div className="sm:col-span-3"><Label htmlFor={`milestone-desc-${index}`}>Deskripsi (opsional)</Label><textarea id={`milestone-desc-${index}`} maxLength={500} value={item.description || ""} onChange={(event) => update(index, { description: event.target.value })} className={`${field} min-h-24 py-3`} /></div></fieldset>)}
    <Button type="button" variant="outline" disabled={disabled || items.length >= 50} onClick={() => onChange([...items, { year: 0, title: "", description: "" }])} className="min-h-11 border-line px-4 text-forest"><Plus />Tambah milestone</Button>
  </div>;
}

export function CanvasEditor({ items, onChange, disabled }: { items: BmcEntry[]; onChange: (items: BmcEntry[]) => void; disabled: boolean }) {
  function update(index: number, patch: Partial<BmcEntry>) { onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  const missing = BMC_LABELS.filter((label) => !items.some((item) => item.label.trim().toLowerCase() === label.toLowerCase()));
  return <div className="space-y-5"><div><h3 className="text-base font-semibold text-forest">Business Model Canvas</h3><p className="mt-2 text-sm leading-6 text-muted">Susun bagaimana usaha menciptakan nilai. Blok yang sudah ada tetap dipertahankan, termasuk label khusus. Simpan bersama perubahan profil.</p></div>
    <div className="grid gap-4 lg:grid-cols-2">{items.map((item, index) => <fieldset key={index} disabled={disabled} className="rounded-lg border border-line bg-ivory p-4"><legend className="px-2 text-xs text-muted">Blok {index + 1}</legend><div className="flex items-end gap-2"><div className="min-w-0 flex-1"><Label htmlFor={`bmc-label-${index}`}>Nama blok</Label><Input id={`bmc-label-${index}`} required maxLength={100} value={item.label} onChange={(event) => update(index, { label: event.target.value })} className={field} /></div><Button type="button" variant="ghost" aria-label={`Hapus blok ${item.label || index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))} className="min-h-11 text-red-700"><Trash2 /></Button></div><Label htmlFor={`bmc-value-${index}`} className="mt-4 block">Isi blok</Label><textarea id={`bmc-value-${index}`} required maxLength={1000} value={item.value} onChange={(event) => update(index, { value: event.target.value })} className={`${field} min-h-32 py-3 leading-6`} /></fieldset>)}</div>
    {items.length === 0 ? <p className="rounded-lg bg-ivory p-4 text-sm text-muted">Belum ada blok model bisnis. Pilih blok standar di bawah atau tambahkan label khusus.</p> : null}
    {missing.length ? <div><p className="mb-3 text-xs font-medium text-muted">Tambahkan blok standar</p><div className="flex flex-wrap gap-2">{missing.map((label) => <Button key={label} type="button" variant="outline" disabled={disabled || items.length >= 30} onClick={() => onChange([...items, { label, value: "" }])} className="min-h-11 border-line px-3 text-xs text-forest"><Plus />{label}</Button>)}</div></div> : null}
    <Button type="button" variant="outline" disabled={disabled || items.length >= 30} onClick={() => onChange([...items, { label: "", value: "" }])} className="min-h-11 border-line px-4 text-forest"><Plus />Tambah blok khusus</Button><p className="text-xs text-muted">{items.length}/30 blok · maksimal 1000 karakter per isi blok</p>
  </div>;
}
