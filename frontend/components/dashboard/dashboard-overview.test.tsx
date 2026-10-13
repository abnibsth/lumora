import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";
import type { OwnedBusiness } from "@/types/business";

const profile: OwnedBusiness = { id: "1", slug: "usaha", name: "Kopi Bandung", category: "F&B", location: "Bandung", description: "Kopi lokal", story: "Dirintis bersama keluarga", foundedYear: 2020, owner: { name: "Rani", role: "Pendiri", bio: "Pemilik usaha" }, milestones: [], bmc: [], status: "draft" };
const props = { name: "Rani Wijaya", total: 0, savedCount: 0, profile: null, businesses: [], onSelect: () => {}, onCreate: () => {}, onEdit: () => {}, onSaved: () => {}, onRetry: () => {}, busy: false };

describe("workspace overview states", () => {
  it("welcomes the authenticated user and offers create only once", () => {
    const html = renderToStaticMarkup(createElement(DashboardOverview, props));
    expect(html).toContain("Rani Wijaya");
    expect(html.match(/>Buat profil<\/button>/g)).toHaveLength(1);
  });
  it("shows four real onboarding steps without invented progress for a new account", () => {
    const html = renderToStaticMarkup(createElement(DashboardOverview, props));
    expect(html).toContain("Buat profil bisnis");
    expect(html).toContain("Lengkapi informasi dan foto");
    expect(html).toContain("Tambahkan cerita usaha");
    expect(html).toContain("Publikasikan profil");
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toMatch(/\sdisabled(?:=|\s|>)/);
  });
  it("does not misrepresent a failed request as a new empty account", () => {
    const html = renderToStaticMarkup(createElement(DashboardOverview, { ...props, profilesError: "Koneksi gagal" }));
    expect(html).toContain("Koneksi gagal");
    expect(html).toContain("Coba lagi");
    expect(html).not.toContain("Buat profil bisnis");
  });
  it.each(["draft", "published"] as const)("shows the actual %s business status instead of onboarding", (status) => {
    const business = { ...profile, status };
    const html = renderToStaticMarkup(createElement(DashboardOverview, { ...props, total: 1, profile: business, businesses: [business] }));
    expect(html).toContain("Kopi Bandung");
    expect(html).toContain(status === "published" ? "Terbit" : "Draft");
    expect(html).not.toContain("Buat profil bisnis");
  });
});
