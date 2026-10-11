import { describe, expect, it } from "vitest";
import { getRedirectTarget } from "./redirect";
import { ROUTES } from "./constants";

describe("getRedirectTarget", () => {
  it("allows safe internal relative paths", () => {
    expect(getRedirectTarget("/explore")).toBe("/explore");
    expect(getRedirectTarget("/business/kopi-ruang-senja")).toBe("/business/kopi-ruang-senja");
  });

  it("rejects open redirects with protocol-relative slashes", () => {
    expect(getRedirectTarget("//evil.com")).toBe(ROUTES.dashboard);
  });

  it("rejects non-relative or undefined inputs", () => {
    expect(getRedirectTarget("https://evil.com")).toBe(ROUTES.dashboard);
    expect(getRedirectTarget(undefined)).toBe(ROUTES.dashboard);
    expect(getRedirectTarget(["/explore", "/dashboard"])).toBe(ROUTES.dashboard);
  });
});
