"use client";

import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileError } from "@/lib/profile-management";

export const profileFieldClass = "mt-2 min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm";
export const profileAreaClass = `${profileFieldClass} min-h-32 py-3 leading-7`;

export function ProfileField({ field, label, errors, children }: { field: string; label: string; errors: ProfileError[]; children: ReactNode }) {
  const error = errors.find((item) => item.field === field);
  return <div><Label htmlFor={`profile-${field}`} className="text-sm text-forest">{label}</Label>{children}{error ? <p id={`error-${field}`} role="alert" className="mt-2 text-xs leading-5 text-red-700">{error.message}</p> : null}</div>;
}
export function validationProps(field: string, errors: ProfileError[]) {
  const hasError = errors.some((item) => item.field === field);
  return { id: `profile-${field}`, "aria-invalid": hasError || undefined, "aria-describedby": hasError ? `error-${field}` : undefined };
}
export function ProfileInput({ field, label, errors, ...props }: ComponentProps<typeof Input> & { field: string; label: string; errors: ProfileError[] }) {
  return <ProfileField field={field} label={label} errors={errors}><Input {...props} {...validationProps(field, errors)} className={profileFieldClass} /></ProfileField>;
}
export function UnavailableFields({ labels, reason }: { labels: string[]; reason: string }) {
  return <div className="rounded-lg border border-dashed border-line bg-ivory/50 p-4"><p className="text-xs font-semibold text-muted">Belum didukung penyimpanan</p><p className="mt-2 text-xs leading-6 text-muted">{reason}</p><ul className="mt-3 flex flex-wrap gap-2" aria-label="Field belum tersedia">{labels.map((label) => <li key={label} className="rounded-md bg-ivory px-3 py-2 text-xs text-muted">{label}</li>)}</ul></div>;
}
