import type { BmcEntry, BusinessMilestone, BusinessWriteInput, OwnedBusiness, AIDraftProfile } from "@/types/business";

export const WORKSPACE_VIEWS = ["overview", "profiles", "story", "canvas", "saved", "ai", "settings"] as const;
export type WorkspaceView = (typeof WORKSPACE_VIEWS)[number];
export type EditorSection = "identity" | "story" | "owner" | "media" | "canvas" | "partners" | "ai";
export const BMC_LABELS = ["Mitra Utama", "Aktivitas Utama", "Sumber Daya Utama", "Proposisi Nilai", "Hubungan Pelanggan", "Saluran", "Segmen Pelanggan", "Struktur Biaya", "Sumber Pendapatan"] as const;

export function resolveView(value?: string | null): WorkspaceView {
  return WORKSPACE_VIEWS.includes(value as WorkspaceView) ? value as WorkspaceView : "overview";
}

export function dashboardHref(view: WorkspaceView, businessId?: string) {
  const query = new URLSearchParams();
  if (view !== "overview") query.set("view", view);
  if (businessId) query.set("business", businessId);
  return `/dashboard${query.size ? `?${query}` : ""}`;
}

export function completionFor(business: OwnedBusiness | null) {
  if (!business) return null;
  const has = (value?: string) => Boolean(value?.trim());
  const checks: { key: EditorSection; label: string; complete: boolean }[] = [
    { key: "identity", label: "Identitas usaha", complete: has(business.name) && has(business.category) && has(business.location) && business.foundedYear >= 1900 },
    { key: "identity", label: "Deskripsi singkat", complete: has(business.description) },
    { key: "story", label: "Cerita usaha", complete: has(business.story) },
    { key: "owner", label: "Informasi pemilik", complete: has(business.owner.name) && has(business.owner.role) && has(business.owner.bio) },
    { key: "media", label: "Gambar cover", complete: has(business.coverImage) },
    { key: "media", label: "Logo usaha", complete: has(business.logo) },
    { key: "story", label: "Perjalanan usaha", complete: business.milestones.some((item) => has(item.title) && item.year >= 1900) },
    { key: "canvas", label: "9 blok model bisnis", complete: BMC_LABELS.every((label) => business.bmc.some((item) => item.label.trim().toLowerCase() === label.toLowerCase() && has(item.value))) },
    { key: "partners", label: "Kebutuhan mitra", complete: Boolean(business.seeking?.some((item) => has(item))) && has(business.seekingObjective) },
  ];
  const completed = checks.filter((check) => check.complete).length;
  return { checks, completed, total: checks.length, percent: Math.round(completed / checks.length * 100) };
}

export type ProfileForm = Omit<BusinessWriteInput, "foundedYear" | "owner" | "seeking" | "milestones" | "bmc"> & {
  foundedYear: string;
  ownerName: string;
  ownerRole: string;
  ownerBio: string;
  seeking: string;
  milestones: BusinessMilestone[];
  bmc: BmcEntry[];
};

export function emptyForm(ownerName = ""): ProfileForm {
  return { name: "", category: "F&B", location: "", description: "", story: "", foundedYear: "", ownerName, ownerRole: "", ownerBio: "", coverImage: "", logo: "", seeking: "", seekingObjective: "", milestones: [], bmc: [] };
}

export function formFromBusiness(business: OwnedBusiness): ProfileForm {
  return { name: business.name, category: business.category, location: business.location, description: business.description, story: business.story, foundedYear: String(business.foundedYear), ownerName: business.owner.name, ownerRole: business.owner.role, ownerBio: business.owner.bio, coverImage: business.coverImage || "", logo: business.logo || "", seeking: business.seeking?.join(", ") || "", seekingObjective: business.seekingObjective || "", milestones: business.milestones.map((item) => ({ ...item })), bmc: business.bmc.map((item) => ({ ...item })) };
}

export function inputFromForm(form: ProfileForm): BusinessWriteInput {
  const { ownerName, ownerRole, ownerBio, foundedYear, seeking, ...fields } = form;
  return { ...fields, foundedYear: Number(foundedYear), seeking: seeking.split(",").map((item) => item.trim()).filter(Boolean), owner: { name: ownerName, role: ownerRole, bio: ownerBio } };
}

export function applyDraft(form: ProfileForm, draft: AIDraftProfile): ProfileForm {
  return { ...form, name: draft.name || form.name, category: draft.category || form.category, location: draft.location || form.location, description: draft.description || form.description, story: draft.story || form.story, foundedYear: draft.foundedYear ? String(draft.foundedYear) : form.foundedYear, ownerName: draft.owner.name || form.ownerName, ownerRole: draft.owner.role || form.ownerRole, ownerBio: draft.owner.bio || form.ownerBio, seeking: draft.seeking.length ? draft.seeking.join(", ") : form.seeking, seekingObjective: draft.seekingObjective || form.seekingObjective, milestones: draft.milestones.length ? draft.milestones.map((item) => ({ ...item })) : form.milestones, bmc: draft.bmc.length ? draft.bmc.map((item) => ({ ...item })) : form.bmc };
}
