import { formFromBusiness, inputFromForm, type EditorSection, type ProfileForm } from "./dashboard";
import { BUSINESS_CATEGORIES, type BusinessWriteInput, type OwnedBusiness } from "@/types/business";

export const PROFILE_STEPS = ["Identitas Usaha", "Lokasi & Kontak", "Foto & Branding", "Detail Bisnis"] as const;
export type ProfileError = { field: string; step: number; message: string };

export function stepForSection(section: EditorSection) {
  return ({ identity: 0, location: 1, media: 2, owner: 3, details: 3, story: 4, partners: 5, canvas: 3, ai: 0 } as const)[section];
}
export const SECTION_FOR_STEP: EditorSection[] = ["identity", "location", "media", "details"];

export function validateProfile(form: ProfileForm, step?: number): ProfileError[] {
  const errors: ProfileError[] = [];
  function text(field: string, value: string | undefined, label: string, max: number, at: number, required = true) {
    const trimmed = value?.trim() || "";
    if (required && !trimmed) errors.push({ field, step: at, message: `${label} wajib diisi.` });
    else if (new TextEncoder().encode(trimmed).length > max) errors.push({ field, step: at, message: `${label} maksimal ${max} karakter.` });
  }
  text("name", form.name, "Nama usaha", 100, 0);
  if (!BUSINESS_CATEGORIES.includes(form.category)) errors.push({ field: "category", step: 0, message: "Pilih kategori bisnis yang tersedia." });
  const year = Number(form.foundedYear);
  if (!form.foundedYear.trim() || !Number.isInteger(year) || year < 1900 || year > 2100) errors.push({ field: "foundedYear", step: 0, message: "Tahun berdiri harus bilangan bulat antara 1900–2100." });
  text("description", form.description, "Deskripsi singkat", 5000, 0);
  text("location", form.location, "Kota/lokasi", 200, 1);
  text("coverImage", form.coverImage, "URL cover", 2048, 2, false);
  text("logo", form.logo, "URL logo", 2048, 2, false);
  text("ownerName", form.ownerName, "Nama pemilik", 100, 3);
  text("ownerRole", form.ownerRole, "Peran pemilik", 100, 3);
  text("ownerBio", form.ownerBio, "Bio pemilik", 1000, 3);
  if (form.bmc.length > 30) errors.push({ field: "bmc", step: 3, message: "Model bisnis maksimal 30 blok." });
  form.bmc.forEach((entry, i) => { text(`bmc-label-${i}`, entry.label, `Label blok ${i + 1}`, 100, 3); text(`bmc-value-${i}`, entry.value, `Isi blok ${i + 1}`, 1000, 3); });
  text("story", form.story, "Cerita usaha", 5000, 4);
  if (form.milestones.length > 50) errors.push({ field: "milestones", step: 4, message: "Perjalanan usaha maksimal 50 milestone." });
  form.milestones.forEach((entry, i) => {
    if (!Number.isInteger(entry.year) || entry.year < 1900 || entry.year > 2100) errors.push({ field: `milestone-year-${i}`, step: 4, message: `Tahun milestone ${i + 1} harus antara 1900–2100.` });
    text(`milestone-title-${i}`, entry.title, `Judul milestone ${i + 1}`, 150, 4);
    text(`milestone-desc-${i}`, entry.description, `Deskripsi milestone ${i + 1}`, 500, 4, false);
  });
  const needs = form.seeking.split(",").map((item) => item.trim()).filter(Boolean);
  if (needs.length > 10 || needs.some((item) => new TextEncoder().encode(item).length > 100)) errors.push({ field: "seeking", step: 5, message: "Maksimal 10 jenis kerja sama, masing-masing 100 karakter." });
  text("seekingObjective", form.seekingObjective, "Deskripsi peluang", 500, 5, false);
  return step === undefined ? errors : errors.filter((error) => error.step === step);
}

export function profilePatch(form: ProfileForm, baseline: ProfileForm): Partial<BusinessWriteInput> {
  const next = inputFromForm(form);
  const before = inputFromForm(baseline);
  return Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key as keyof BusinessWriteInput]))) as Partial<BusinessWriteInput>;
}

export function publishReadiness(business: OwnedBusiness, emailVerified: boolean): string[] {
  const issues = validateProfile(formFromBusiness(business)).filter((error) => !error.field.startsWith("bmc") && !error.field.startsWith("milestone") && !["seeking", "seekingObjective", "coverImage", "logo"].includes(error.field)).map((error) => error.message);
  if (!emailVerified) issues.push("Verifikasi email akun terlebih dahulu.");
  return issues;
}

export function previewFromForm(form: ProfileForm, original?: OwnedBusiness | null): OwnedBusiness {
  return { ...original, ...inputFromForm(form), id: original?.id || "unsaved", slug: original?.slug || "", status: original?.status || "draft", milestones: form.milestones, bmc: form.bmc };
}

export function safeMediaUrl(value?: string): string | null {
  if (!value || value !== value.trim() || value.includes("\\") || /[\u0000- ]/.test(value)) return null;
  if (value.startsWith("/uploads/") && !value.includes("..")) return value;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? value : null; } catch { return null; }
}
