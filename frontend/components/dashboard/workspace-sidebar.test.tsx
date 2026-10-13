import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceSidebar } from "./workspace-sidebar";

function render(open: boolean) {
  return renderToStaticMarkup(createElement(TooltipProvider, null, createElement(SidebarProvider, { open }, createElement(WorkspaceSidebar, { view: "overview", onNavigate: () => {} }))));
}

describe("workspace sidebar", () => {
  it("uses a standalone symbol and omits visible labels when collapsed", () => {
    const html = render(false);
    expect(html).toContain("logo-symbol.png");
    expect(html).not.toContain("logo-nav.png");
    expect(html).not.toContain("overflow-hidden\" aria-hidden=\"true\"");
    expect(html).not.toContain(">Business Workspace<");
    expect(html).not.toContain(">Dashboard<");
    expect(html).toContain('aria-label="Dashboard"');
    expect(html).toContain('aria-current="page"');
  });
  it("keeps the complete logo and menu groups when expanded", () => {
    const html = render(true);
    expect(html).toContain("logo-nav.png");
    expect(html).toContain(">Menu utama<");
    expect(html).toContain(">Pengembangan bisnis<");
    expect(html).toContain(">Dashboard<");
  });
  it("does not attach tooltip triggers or native titles to collapsed navigation", () => {
    const html = render(false);
    const controls = html.match(/<(?:button|a)[^>]*data-slot="sidebar-menu-button"[^>]*>/g) || [];
    expect(controls).toHaveLength(9);
    for (const control of controls) {
      expect(control).toContain("aria-label=");
      expect(control).not.toContain("data-state=");
      expect(control).not.toContain("title=");
    }
    expect(html).not.toContain('role="tooltip"');
  });
  it("keeps coming-soon icons labelled and unavailable without enabling navigation", () => {
    const html = render(false);
    const analytics = html.match(/<button[^>]*aria-label="Analitik Profil — Segera Hadir"[^>]*>/)?.[0];
    expect(analytics).toBeDefined();
    expect(analytics).toContain('aria-disabled="true"');
    expect(analytics).not.toMatch(/\sdisabled(?:=|\s|>)/);
  });
});
