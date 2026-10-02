import { businesses as dummyBusinesses } from "@/data/businesses";
import type { Business, BusinessCategory } from "@/types/business";
import type { User } from "@/types/user";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    "https://lumora-backend-production-ed55.up.railway.app"
  );
}

export interface BusinessListResponse {
  items: Business[];
  total: number;
  page: number;
  limit: number;
}

export interface BusinessFilterParams {
  q?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export async function fetchBusinesses(
  params?: BusinessFilterParams,
): Promise<BusinessListResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.category && params.category !== "Semua") {
    query.set("category", params.category);
  }
  if (params?.location) query.set("location", params.location);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const url = `${getApiBaseUrl()}/api/v1/businesses${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as BusinessListResponse;
      if (Array.isArray(data.items)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Backend API unavailable, falling back to local data:", err);
  }

  // Fallback to local dummy data if backend is offline or fails
  const categoryFilter = params?.category && params.category !== "Semua" ? params.category : null;
  const term = params?.q?.trim().toLowerCase();

  const filtered = dummyBusinesses.filter((b) => {
    const matchesCat = !categoryFilter || b.category === (categoryFilter as BusinessCategory);
    const matchesQ =
      !term ||
      [b.name, b.category, b.location, b.description]
        .join(" ")
        .toLowerCase()
        .includes(term);
    return matchesCat && matchesQ;
  });

  return {
    items: filtered,
    total: filtered.length,
    page: params?.page ?? 1,
    limit: params?.limit ?? filtered.length,
  };
}

export async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  const url = `${getApiBaseUrl()}/api/v1/businesses/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as Business;
      return data;
    }
  } catch (err) {
    console.warn(`Backend API detail failed for ${slug}, falling back:`, err);
  }

  return dummyBusinesses.find((b) => b.slug === slug) ?? null;
}

export async function loginApi(params: {
  email: string;
  password: string;
}): Promise<{ ok: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.message || "Email atau kata sandi salah." };
    }
    return { ok: true, user: data as User };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function registerApi(params: {
  name: string;
  email: string;
  password: string;
  role?: "umkm" | "mitra";
}): Promise<{ ok: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "umkm", ...params }),
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.message || "Pendaftaran gagal. Periksa input data." };
    }
    return { ok: true, user: data as User };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function logoutApi(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getMeApi(): Promise<User | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      credentials: "include",
    });
    if (res.ok) {
      return (await res.json()) as User;
    }
  } catch {
    // Ignore error
  }
  return null;
}
