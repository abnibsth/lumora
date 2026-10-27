import type {
  Business,
  BusinessWriteInput,
  AIDraftProfile,
  OwnedBusiness,
} from "@/types/business";
import type { ApiErrorResponse, User } from "@/types/user";
import { resolveBusinessCover } from "@/lib/business";

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

export interface OwnedBusinessListResponse {
  items: OwnedBusiness[];
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

export interface ApiActionResult {
  ok: boolean;
  code?: string;
  error?: string;
}

export interface AdminOverview {
  metrics: {
    totalUsers: number;
    totalUmkmUsers: number;
    totalMitraUsers: number;
    totalBusinesses: number;
    publishedBusinesses: number;
    unverifiedPublishedBusinesses: number;
  };
  registrationGrowth: Array<{ month: string; count: number }>;
  recentBusinesses: Array<{
    id: string;
    name: string;
    category: string;
    location: string;
    createdAt: string;
    status: "draft" | "published" | "archived";
    verified: boolean;
  }>;
}

function getApiError(data: unknown, fallback: string): Omit<ApiActionResult, "ok"> {
  const response = data as Partial<ApiErrorResponse>;
  return {
    code: response.error?.code,
    error: response.error?.message || fallback,
  };
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

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Business list request failed with status ${res.status}`);

  const data = (await res.json()) as BusinessListResponse;
  if (!Array.isArray(data.items)) throw new Error("Business list response is invalid");
  data.items = data.items.map((item) => ({
    ...item,
    coverImage: resolveBusinessCover(item.slug, item.coverImage, item.name),
  }));
  return data;
}

export async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  const url = `${getApiBaseUrl()}/api/v1/businesses/${encodeURIComponent(slug)}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Business detail request failed with status ${res.status}`);
  const item = (await res.json()) as Business;
  if (item) {
    item.coverImage = resolveBusinessCover(item.slug, item.coverImage, item.name);
  }
  return item;
}

export async function loginApi(params: {
  email: string;
  password: string;
}): Promise<ApiActionResult & { user?: User }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      credentials: "include",
    });

    const data = (await res.json()) as User | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Email atau kata sandi salah.") };
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
}): Promise<ApiActionResult & { user?: User }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "umkm", ...params }),
      credentials: "include",
    });

    const data = (await res.json()) as User | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Pendaftaran gagal. Periksa input data.") };
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

export async function getMeApi(cookie?: string): Promise<User | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      credentials: "include",
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.ok) {
      return (await res.json()) as User;
    }
  } catch {
    // Ignore error
  }
  return null;
}

export async function verifyEmailApi(token: string): Promise<ApiActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (res.ok) return { ok: true };

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Verifikasi email gagal.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function resendVerificationApi(): Promise<ApiActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/resend-verification`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) return { ok: true };

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Email verifikasi gagal dikirim ulang.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchMyBusinesses(cookie?: string, params?: { page?: number; limit?: number }): Promise<
  ApiActionResult & { data?: OwnedBusinessListResponse }
> {
  try {
    const query = new URLSearchParams({ limit: String(params?.limit ?? 50) });
    if (params?.page) query.set("page", String(params.page));
    const res = await fetch(`${getApiBaseUrl()}/api/v1/businesses/mine?${query}`, {
      credentials: "include",
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.ok) {
      return { ok: true, data: (await res.json()) as OwnedBusinessListResponse };
    }

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Profil bisnis gagal dimuat.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function createBusinessApi(
  input: BusinessWriteInput,
): Promise<ApiActionResult & { business?: OwnedBusiness }> {
  return writeBusinessApi("/api/v1/businesses", "POST", input);
}

export async function updateBusinessApi(
  id: string,
  input: Partial<BusinessWriteInput>,
): Promise<ApiActionResult & { business?: OwnedBusiness }> {
  return writeBusinessApi(`/api/v1/businesses/${encodeURIComponent(id)}`, "PATCH", input);
}

async function writeBusinessApi(
  path: string,
  method: "POST" | "PATCH",
  input: Partial<BusinessWriteInput>,
): Promise<ApiActionResult & { business?: OwnedBusiness }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as OwnedBusiness | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Profil bisnis gagal disimpan.") };
    }
    return { ok: true, business: data as OwnedBusiness };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function publishBusinessApi(
  id: string,
): Promise<ApiActionResult & { business?: OwnedBusiness }> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/v1/businesses/${encodeURIComponent(id)}/publish`,
      { method: "POST", credentials: "include" },
    );
    const data = (await res.json()) as OwnedBusiness | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Profil bisnis gagal diterbitkan.") };
    }
    return { ok: true, business: data as OwnedBusiness };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function archiveBusinessApi(id: string): Promise<ApiActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/businesses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) return { ok: true };

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Profil bisnis gagal diarsipkan.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function uploadMediaApi(
  file: File,
): Promise<ApiActionResult & { url?: string }> {
  try {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${getApiBaseUrl()}/api/v1/media`, {
      method: "POST",
      credentials: "include",
      body,
    });
    const data = (await res.json()) as { url: string } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gambar gagal diunggah.") };
    }
    return { ok: true, url: (data as { url: string }).url };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function draftProfileApi(
  narrative: string,
): Promise<ApiActionResult & { draft?: AIDraftProfile }> {
  try {
    const res = await fetch(`/api/ai/draft-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narrative }),
    });
    const data = (await res.json()) as AIDraftProfile | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Draf AI gagal dibuat.") };
    }
    return { ok: true, draft: data as AIDraftProfile };
  } catch {
    return { ok: false, error: "Gagal terhubung ke layanan Lumora AI." };
  }
}

export async function fetchBookmarks(cookie?: string): Promise<
  ApiActionResult & { data?: BusinessListResponse }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/bookmarks`, {
      credentials: "include",
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.ok) {
      return { ok: true, data: (await res.json()) as BusinessListResponse };
    }

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Bookmark gagal dimuat.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function addBookmarkApi(slug: string): Promise<ApiActionResult> {
  return mutateBookmarkApi(slug, "POST");
}

export async function removeBookmarkApi(slug: string): Promise<ApiActionResult> {
  return mutateBookmarkApi(slug, "DELETE");
}

async function mutateBookmarkApi(slug: string, method: "POST" | "DELETE"): Promise<ApiActionResult> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/v1/bookmarks/${encodeURIComponent(slug)}`,
      { method, credentials: "include" },
    );
    if (res.ok) return { ok: true };

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Bookmark gagal diperbarui.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function updateAccountApi(
  name: string,
): Promise<ApiActionResult & { user?: User }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    });
    const data = (await res.json()) as User | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Nama akun gagal diperbarui.") };
    }
    return { ok: true, user: data as User };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<ApiActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) return { ok: true };

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Kata sandi gagal diubah.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function deleteAccountApi(password: string): Promise<ApiActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    if (res.ok) return { ok: true };

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Akun gagal dihapus.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchAdminOverview(cookie?: string): Promise<
  ApiActionResult & { data?: AdminOverview }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/overview`, {
      credentials: "include",
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.ok) return { ok: true, data: (await res.json()) as AdminOverview };

    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Overview admin gagal dimuat.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}
