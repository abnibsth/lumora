import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BusinessEditor } from "./business-editor";
import { ProfileStepper } from "./profile-stepper";
import { ProfileSteps } from "./profile-steps";
import { WorkspaceDomainEditor } from "./workspace-domain-editor";
import { emptyForm } from "@/lib/dashboard";

const form = { ...emptyForm("User"), bmc: [{ label: "Custom", value: "A" }, { label: "Custom", value: "B" }] };
const callbacks = { onChange: () => {}, onSubmit: () => {}, onPreview: () => {}, onApply: () => {}, onBusyChange: () => {}, onSessionExpired: () => {} };

describe("separate workspace presentation", () => {
  it("renders only four profile steps", () => {
    const html = renderToStaticMarkup(createElement(ProfileStepper, { step: 0, busy: false, onStep: () => {} }));
    expect(html).toContain("Langkah 1 dari 4");
    expect(html.match(/<li>/g)).toHaveLength(4);
    expect(html).not.toContain("Cerita &amp; Perjalanan");
  });
  it("does not make unsupported contacts editable or claimed saved", () => {
    const html = renderToStaticMarkup(createElement(ProfileSteps, { form, step: 1, errors: [], disabled: false, onChange: () => {} }));
    expect(html).toContain("Belum didukung penyimpanan");
    expect(html.match(/<input/g)).toHaveLength(1);
  });
  it("keeps story out of the wizard and explains first draft requirement", () => {
    const html = renderToStaticMarkup(createElement(BusinessEditor, { ...callbacks, form, section: "details", dirty: false, saving: false, onSection: () => {}, onCancel: () => {}, onWorkspace: () => {} }));
    expect(html).not.toContain('id="profile-story"');
    expect(html).toContain("Lengkapi di Cerita Usaha");
    expect(html).not.toContain('id="bmc-value-0"');
  });
  it.each(["story", "canvas", "saved", "ai"] as const)("renders %s without any wizard stepper", (view) => {
    const html = renderToStaticMarkup(createElement(WorkspaceDomainEditor, { ...callbacks, form, view, disabled: false, dirty: false, creating: false, emailVerified: true }));
    expect(html).not.toContain("Langkah pembuatan profil");
    expect(html).not.toContain(">Lanjut<");
    if (view === "story") expect(html).toContain('id="profile-story"');
    if (view === "canvas") expect(html.match(/id="canvas-slot-/g)).toHaveLength(9);
    if (view === "saved") expect(html).toContain('id="profile-seeking"');
  });
});
