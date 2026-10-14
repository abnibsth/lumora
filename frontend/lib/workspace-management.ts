import { formFromBusiness, inputFromForm, type ProfileForm, type WorkspaceView } from "./dashboard";
import { profilePatch, validateProfile } from "./profile-management";
import type { BusinessWriteInput, OwnedBusiness } from "@/types/business";

export type BusinessWorkspace = "profiles" | "story" | "canvas" | "saved" | "ai";
export const BUSINESS_VIEWS: readonly WorkspaceView[] = ["profiles", "story", "canvas", "saved", "ai"];
const scope: Record<BusinessWorkspace, readonly (keyof BusinessWriteInput)[]> = {
  profiles: ["name", "category", "foundedYear", "description", "location", "owner", "logo", "coverImage", "bmc"],
  story: ["story", "milestones"], canvas: ["bmc"], saved: ["seeking", "seekingObjective"], ai: [],
};
export function scopedPatch(form: ProfileForm, baseline: ProfileForm, view: BusinessWorkspace): Partial<BusinessWriteInput> {
  return Object.fromEntries(Object.entries(profilePatch(form, baseline)).filter(([key]) => scope[view].includes(key as keyof BusinessWriteInput)));
}
function domainForField(field: string): BusinessWorkspace {
  if (field === "story" || field.startsWith("milestone")) return "story";
  if (field === "seeking" || field === "seekingObjective") return "saved";
  if (field.startsWith("bmc")) return "canvas";
  return "profiles";
}
export function validateWorkspace(form: ProfileForm, view: BusinessWorkspace, creating: boolean) {
  const errors = validateProfile(form);
  return creating ? errors : errors.filter((error) => domainForField(error.field) === view || (view === "profiles" && domainForField(error.field) === "canvas"));
}
export function viewForField(field: string): BusinessWorkspace { return domainForField(field); }
export function mergeSavedForm(form: ProfileForm, baseline: ProfileForm, business: OwnedBusiness, view: BusinessWorkspace, created = false) {
  const server = formFromBusiness(business);
  if (created) return { form: server, baseline: server };
  const next = { ...server };
  const sent = scopedPatch(form, baseline, view);
  const pending = inputFromForm(form);
  const before = inputFromForm(baseline);
  const keys = Object.keys(form) as (keyof ProfileForm)[];
  for (const key of keys) {
    const apiKey: keyof BusinessWriteInput = key.startsWith("owner") ? "owner" : key as keyof BusinessWriteInput;
    if (!(apiKey in sent) && JSON.stringify(pending[apiKey]) !== JSON.stringify(before[apiKey])) Object.assign(next, { [key]: form[key] });
  }
  return { form: next, baseline: server };
}
export function resolveOwnedSelection(items: OwnedBusiness[], id: string | null) { return id ? items.find((item) => item.id === id) || null : items[0] || null; }
