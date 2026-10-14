import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBusinessBySlug, fetchBusinesses, fetchMyBusinesses, createBusinessApi, updateBusinessApi, publishBusinessApi, archiveBusinessApi, draftProfileApi, uploadMediaApi, removeBookmarkApi } from "./api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dashboard API contracts", () => {
  it("fetches the requested owned page with the actual total and cookie", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ items: [], total: 61, page: 2, limit: 50 }));
    vi.stubGlobal("fetch", fetcher);
    const result = await fetchMyBusinesses("lumora_session=test", { page: 2, limit: 50 });
    expect(result.data?.total).toBe(61);
    expect(fetcher.mock.calls[0]).toEqual([expect.stringContaining("/businesses/mine?limit=50&page=2"), expect.objectContaining({ headers: { Cookie: "lumora_session=test" } })]);
  });
  it("preserves the default first-page URL", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ items: [], total: 0, page: 1, limit: 50 }));
    vi.stubGlobal("fetch", fetcher);
    await fetchMyBusinesses();
    expect(fetcher.mock.calls[0][0]).toEqual(expect.stringContaining("/businesses/mine?limit=50"));
  });
  it("keeps mutation endpoints and structured draft payloads", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ id: "1", status: "draft" }));
    vi.stubGlobal("fetch", fetcher);
    const input = { name: "Usaha", category: "F&B" as const, location: "Bandung", description: "Usaha", story: "Cerita", foundedYear: 2020, owner: { name: "User", role: "Pendiri", bio: "Bio" }, milestones: [{ year: 2020, title: "Mulai" }], bmc: [{ label: "Custom", value: "Tetap" }], seeking: [] };
    await createBusinessApi(input);
    await updateBusinessApi("1", input);
    await publishBusinessApi("1");
    await archiveBusinessApi("1");
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([expect.stringContaining("/businesses"), expect.stringContaining("/businesses/1"), expect.stringContaining("/businesses/1/publish"), expect.stringContaining("/businesses/1")]);
    expect(fetcher.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "PATCH", body: JSON.stringify(input) }));
  });
  it("does not send unchanged structured data in a partial profile PATCH", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ id: "1", status: "draft" }));
    vi.stubGlobal("fetch", fetcher);
    await updateBusinessApi("1", { name: "Nama baru" });
    expect(fetcher.mock.calls[0][1]).toEqual(expect.objectContaining({ method: "PATCH", body: JSON.stringify({ name: "Nama baru" }) }));
    expect(fetcher.mock.calls[0][1]?.body).not.toContain("milestones");
    expect(fetcher.mock.calls[0][1]?.body).not.toContain("bmc");
  });
  it("surfaces verified-email errors without pretending publish succeeded", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => jsonResponse({ error: { code: "email_not_verified", message: "Verifikasi email" } }, 403)));
    expect(await publishBusinessApi("1")).toEqual({ ok: false, code: "email_not_verified", error: "Verifikasi email" });
  });
  it("uses the existing AI, upload and bookmark endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ url: "/uploads/test.png" }));
    vi.stubGlobal("fetch", fetcher);
    await draftProfileApi("Narasi usaha yang faktual");
    await uploadMediaApi(new File(["image"], "test.png", { type: "image/png" }));
    await removeBookmarkApi("kopi-lokal");
    expect(fetcher.mock.calls[0]).toEqual([expect.stringContaining("/ai/draft-profile"), expect.objectContaining({ body: JSON.stringify({ narrative: "Narasi usaha yang faktual" }) })]);
    expect(fetcher.mock.calls[1][1]).toEqual(expect.objectContaining({ body: expect.any(FormData) }));
    expect(fetcher.mock.calls[2]).toEqual([expect.stringContaining("/bookmarks/kopi-lokal"), expect.objectContaining({ method: "DELETE" })]);
  });
});

describe("fetchBusinesses", () => {
  it("returns the parsed list envelope", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => jsonResponse({ items: [], total: 0, page: 1, limit: 12 })));
    await expect(fetchBusinesses({ limit: 12 })).resolves.toEqual({ items: [], total: 0, page: 1, limit: 12 });
  });

  it("throws instead of falling back to mock data on a server error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    await expect(fetchBusinesses()).rejects.toThrow();
  });

  it("throws when the response shape is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => jsonResponse({ items: null })));
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
