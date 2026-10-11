import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBusinessBySlug, fetchBusinesses } from "./api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchBusinesses", () => {
  it("returns the parsed list envelope", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ items: [], total: 0, page: 1, limit: 12 })));
    await expect(fetchBusinesses({ limit: 12 })).resolves.toEqual({ items: [], total: 0, page: 1, limit: 12 });
  });

  it("throws instead of falling back to mock data on a server error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    await expect(fetchBusinesses()).rejects.toThrow();
  });

  it("throws when the response shape is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ items: null })));
    await expect(fetchBusinesses()).rejects.toThrow();
  });

  it("throws on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    await expect(fetchBusinesses()).rejects.toThrow();
  });
});

describe("fetchBusinessBySlug", () => {
  it("returns null only for 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
    await expect(fetchBusinessBySlug("tidak-ada")).resolves.toBeNull();
  });

  it("throws on a 500 so a backend outage is not reported as not-found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    await expect(fetchBusinessBySlug("kopi-ruang-senja")).rejects.toThrow();
  });
});
