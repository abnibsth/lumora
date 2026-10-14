import { describe, expect, it } from "vitest";
import { emptyForm, formFromBusiness } from "./dashboard";
import { PROFILE_STEPS } from "./profile-management";
import { scopedPatch, mergeSavedForm, validateWorkspace, resolveOwnedSelection } from "./workspace-management";
import type { OwnedBusiness } from "@/types/business";
const business: OwnedBusiness = { id: "1", slug: "test", name: "Test", category: "F&B", foundedYear: 2020, description: "Usaha", location: "Bandung", story: "Lama", owner: { name: "User", role: "Pendiri", bio: "Bio" }, bmc: [{ label: "Custom", value: "Asli" }], milestones: [], seeking: ["Distribusi"], status: "draft" };

describe("independent business workspaces", () => {
  it("has exactly four profile wizard steps", () => expect(PROFILE_STEPS).toHaveLength(4));
  it("story PATCH does not save unrelated profile or canvas changes", () => {
    const before = formFromBusiness(business);
    const form = { ...before, name: "Belum simpan", story: "Baru", bmc: [{ label: "Custom", value: "Pending" }] };
    expect(scopedPatch(form, before, "story")).toEqual({ story: "Baru" });
  });
  it("merges a story response while preserving other dirty domains", () => {
    const before = formFromBusiness(business);
    const pending = { ...before, name: "Pending nama", story: "Cerita baru", bmc: [{ label: "Custom", value: "Pending canvas" }] };
    const saved = { ...business, story: "Cerita baru" };
    const next = mergeSavedForm(pending, before, saved, "story");
    expect(next.form.name).toBe("Pending nama");
    expect(next.form.bmc).toEqual(pending.bmc);
    expect(next.baseline.story).toBe("Cerita baru");
    expect(scopedPatch(next.form, next.baseline, "story")).toEqual({});
    expect(scopedPatch(next.form, next.baseline, "profiles")).toEqual({ name: "Pending nama", bmc: pending.bmc });
  });
  it("validates existing page independently but never bypasses first-create story requirements", () => {
    const form = emptyForm(); form.story = "Cerita";
    expect(validateWorkspace(form, "story", false)).toEqual([]);
    expect(validateWorkspace(form, "profiles", true).some((e) => e.field === "name")).toBe(true);
    expect(validateWorkspace(emptyForm(), "profiles", true).some((e) => e.field === "story")).toBe(true);
  });
  it("does not fall back to another business for an invalid explicit URL ID", () => {
    expect(resolveOwnedSelection([business], "foreign")).toBeNull();
    expect(resolveOwnedSelection([business], "1")?.id).toBe("1");
    expect(resolveOwnedSelection([business], null)?.id).toBe("1");
  });
});
