import { describe, expect, it } from "vitest";
import { emptyForm, formFromBusiness } from "./dashboard";
import { validateProfile, stepForSection, profilePatch, publishReadiness, previewFromForm, safeMediaUrl } from "./profile-management";
import type { OwnedBusiness } from "@/types/business";

const business: OwnedBusiness = { id: "1", slug: "usaha", name: "Usaha", category: "F&B", location: "Bandung", foundedYear: 2020, description: "Kopi", story: "Cerita", owner: { name: "User", role: "Pendiri", bio: "Bio" }, bmc: [{ label: "Custom", value: "A" }, { label: "Custom", value: "B" }], milestones: [{ year: 2020, title: "Mulai" }], status: "draft", coverPosition: "top", revenueLabel: "Asli" };

describe("profile wizard", () => {
  it("validates only the current step when continuing", () => {
    const form = { ...emptyForm(), name: "Usaha", foundedYear: "2020", description: "Kopi" };
    expect(validateProfile(form, 0)).toEqual([]);
    expect(validateProfile(form).some((error) => error.field === "location")).toBe(true);
  });
  it("does not permit a partial new draft unsupported by the API", () => {
    const errors = validateProfile(emptyForm());
    expect(errors.map((error) => error.field)).toEqual(expect.arrayContaining(["name", "location", "story", "ownerName", "ownerRole", "ownerBio", "foundedYear"]));
  });
  it("maps existing story and media actions to the same wizard data", () => {
    expect(stepForSection("story")).toBe(4);
    expect(stepForSection("media")).toBe(2);
    expect(stepForSection("owner")).toBe(3);
    expect(stepForSection("partners")).toBe(5);
  });
  it("validates backend bounds and whitespace", () => {
    const form = { ...formFromBusiness(business), name: " ", foundedYear: "2020.5", seeking: Array(11).fill("Mitra").join(",") };
    expect(validateProfile(form).map((error) => error.field)).toEqual(expect.arrayContaining(["name", "foundedYear", "seeking"]));
  });
});

describe("profile data preservation", () => {
  it("patches only edited fields and leaves stored structured data alone", () => {
    const original = formFromBusiness(business);
    expect(profilePatch({ ...original, name: "Baru" }, original)).toEqual({ name: "Baru" });
    expect(profilePatch(original, original)).toEqual({});
  });
  it("preserves duplicate and custom BMC blocks when an array is intentionally edited", () => {
    const original = formFromBusiness(business);
    const next = { ...original, bmc: [...original.bmc, { label: "Segmen Pelanggan", value: "Lokal" }] };
    expect(profilePatch(next, original).bmc).toEqual(next.bmc);
    expect(original.bmc).toHaveLength(2);
  });
  it("allows publish below 100 percent when core data and verified email are present", () => {
    expect(publishReadiness(business, true)).toEqual([]);
    expect(publishReadiness(business, false)).toContain("Verifikasi email akun terlebih dahulu.");
  });
  it("builds unsaved preview without dropping existing server-only values", () => {
    const preview = previewFromForm({ ...formFromBusiness(business), name: "Preview" }, business);
    expect(preview.name).toBe("Preview");
    expect(preview.coverPosition).toBe("top");
    expect(preview.revenueLabel).toBe("Asli");
    expect(business.name).toBe("Usaha");
  });
  it("rejects unsafe image URLs", () => {
    expect(safeMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safeMediaUrl("//evil.example/img")).toBeNull();
    expect(safeMediaUrl("/uploads/logo.png")).toBe("/uploads/logo.png");
    expect(safeMediaUrl("https://example.com/logo.png")).toBe("https://example.com/logo.png");
  });
});
