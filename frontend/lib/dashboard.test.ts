import { describe, expect, it } from "vitest";
import { BMC_LABELS, completionFor, formFromBusiness, inputFromForm, resolveView, emptyForm, dashboardHref, applyDraft } from "./dashboard";
import type { OwnedBusiness } from "../types/business";

const business: OwnedBusiness = {
  id: "owned-1", slug: "kopi-lokal", name: "Kopi Lokal", category: "F&B", location: "Bandung",
  description: "Kopi lokal", story: "Cerita usaha", foundedYear: 2020, status: "draft",
  owner: { name: "Pemilik", role: "Pendiri", bio: "Peracik kopi" }, milestones: [], bmc: [],
};

describe("workspace navigation", () => {
  it("uses overview for unavailable or invalid views", () => {
    expect(resolveView("analytics")).toBe("overview");
    expect(resolveView(undefined)).toBe("overview");
    expect(resolveView("canvas")).toBe("canvas");
  });
  it("builds local URLs with encoded owned profile IDs", () => {
    expect(dashboardHref("overview")).toBe("/dashboard");
    expect(dashboardHref("story", "a/b")).toBe("/dashboard?view=story&business=a%2Fb");
  });
});

describe("profile completeness", () => {
  it("does not invent a score for a missing profile", () => expect(completionFor(null)).toBeNull());
  it("counts actual complete sections, not publishing status", () => {
    const result = completionFor(business)!;
    expect(result.completed).toBe(4);
    expect(result.total).toBe(9);
    expect(result.percent).toBe(44);
    expect(completionFor({ ...business, status: "published" })).toEqual(result);
  });
  it("does not count a single custom BMC entry as a complete canvas", () => {
    const result = completionFor({ ...business, bmc: [{ label: "Custom", value: "Isi" }] })!;
    expect(result.checks.find((item) => item.key === "canvas")?.complete).toBe(false);
  });
  it("requires all nine meaningful standard BMC blocks", () => {
    const bmc = BMC_LABELS.map((label) => ({ label, value: "Terisi" }));
    expect(completionFor({ ...business, bmc })!.checks.find((item) => item.key === "canvas")?.complete).toBe(true);
    bmc[0].value = "   ";
    expect(completionFor({ ...business, bmc })!.checks.find((item) => item.key === "canvas")?.complete).toBe(false);
  });
});

describe("editor payload", () => {
  it("preserves custom and duplicate canvas blocks and milestones when editing", () => {
    const original = { ...business, bmc: [{ label: "Custom", value: "A" }, { label: "Custom", value: "B" }], milestones: [{ year: 2020, title: "Mulai", description: "Cerita" }], seeking: ["Distribusi"] };
    const form = formFromBusiness(original);
    const input = inputFromForm(form);
    expect(input.bmc).toEqual(original.bmc);
    expect(input.milestones).toEqual(original.milestones);
    expect(input.seeking).toEqual(original.seeking);
    form.bmc[0].value = "Diubah";
    expect(original.bmc[0].value).toBe("A");
  });
  it("keeps existing structured data when AI returns no replacements", () => {
    const original = formFromBusiness({ ...business, milestones: [{ year: 2020, title: "Mulai" }], bmc: [{ label: "Custom", value: "Pertahankan" }] });
    const next = applyDraft(original, { name: "", category: "", location: "", description: "", story: "", foundedYear: 0, owner: { name: "", role: "", bio: "" }, milestones: [], bmc: [], seeking: [], seekingObjective: "", suggestions: [] });
    expect(next.milestones).toEqual(original.milestones);
    expect(next.bmc).toEqual(original.bmc);
    expect(next.name).toBe(original.name);
  });
  it("creates a new form without reusing another draft's arrays", () => {
    const first = emptyForm("User");
    first.bmc.push({ label: "Custom", value: "A" });
    expect(emptyForm("User").bmc).toEqual([]);
    expect(first.ownerName).toBe("User");
  });
  it("converts year and comma-separated partner needs without changing the API shape", () => {
    const input = inputFromForm({ ...formFromBusiness(business), seeking: "Mitra, , Distributor " });
    expect(input.foundedYear).toBe(2020);
    expect(input.seeking).toEqual(["Mitra", "Distributor"]);
    expect(input).not.toHaveProperty("status");
  });
});
