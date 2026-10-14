import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BusinessList } from "./business-list";
import type { OwnedBusiness } from "@/types/business";

const business: OwnedBusiness = { id: "1", slug: "kopi", name: "Kopi", category: "F&B", location: "Bandung", description: "Kopi lokal", story: "Cerita", foundedYear: 2020, owner: { name: "User", role: "Pemilik", bio: "Bio" }, milestones: [], bmc: [], status: "draft" };
const props = { businesses: [business], total: 1, page: 1, busy: false, onPageChange: () => {}, onRetry: () => {}, onCreate: () => {}, onEdit: () => {}, onPublish: () => {}, onArchive: () => {}, onPreview: () => {}, emailVerified: true };

describe("dashboard list preview", () => {
  it("does not repeat the create CTA and uses secondary publish styling", () => {
    const html = renderToStaticMarkup(createElement(BusinessList, { ...props, preview: true }));
    expect(html).not.toContain("Tambah profil");
    expect(html).not.toContain("Buat profil");
    expect(html).toContain("Terbitkan");
    expect(html).not.toContain("bg-forest px-4 text-white");
  });
  it("gives mounted preview and full lists distinct accessible heading IDs", () => {
    const html = renderToStaticMarkup(createElement("div", null, createElement(BusinessList, { ...props, preview: true }), createElement(BusinessList, props)));
    const ids = [...html.matchAll(/<h2 id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    ids.forEach((id) => expect(html).toContain(`aria-labelledby="${id}"`));
  });
});
