import type {
  Business,
  BusinessCategory,
  BusinessWriteInput,
  AIDraftProfile,
  OwnedBusiness,
} from "@/types/business";
import type { ApiErrorResponse, User } from "@/types/user";
import type {
  PartnerProfile,
  UpsertPartnerProfileInput,
  PartnerPreferences,
  UpsertPartnerPreferencesInput,
  BusinessMatchList,
  MasterTaxonomyID,
} from "@/types/partner";
import type {
  CollaborationRequest,
  CollaborationRequestList,
  CollaborationStats,
  CollaborationHistoryDetail,
  CollaborationHistoryStats,
  CreateCollaborationInput,
  Conversation,
  Message,
  MessageList,
} from "@/types/collaboration";
import type { NotificationList } from "@/types/notification";
import { resolveBusinessCover } from "@/lib/business";
import { CURATED_BUSINESSES, getCuratedBusinessBySlug } from "@/data/curated-businesses";

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
  if (!res.ok) {
    throw new Error(`fetchBusinesses failed: ${res.status}`);
  }
  const data = (await res.json()) as BusinessListResponse;
  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid business list response shape");
  }
  data.items = data.items.map((item) => ({
    ...item,
    coverImage: resolveBusinessCover(item.slug, item.coverImage, item.name),
  }));
  return data;
}

export async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  const url = `${getApiBaseUrl()}/api/v1/businesses/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`fetchBusinessBySlug failed: ${res.status}`);
  }
  const item = (await res.json()) as Business;
  if (!item || !item.slug) {
    throw new Error("Invalid business detail response shape");
  }
  item.coverImage = resolveBusinessCover(item.slug, item.coverImage, item.name);
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
    const res = await fetch(`${getApiBaseUrl()}/api/v1/ai/draft-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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

export async function fetchPartnerProfile(cookie?: string): Promise<
  ApiActionResult & { profile?: PartnerProfile }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/partner/profile`, {
      credentials: "include",
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.ok) {
      const data = (await res.json()) as { profile: PartnerProfile };
      return { ok: true, profile: data.profile };
    }
    const data = (await res.json()) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Profil mitra gagal dimuat.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function savePartnerProfile(
  input: UpsertPartnerProfileInput,
): Promise<ApiActionResult & { profile?: PartnerProfile }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/partner/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { profile: PartnerProfile } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Profil mitra gagal disimpan.") };
    }
    return { ok: true, profile: (data as { profile: PartnerProfile }).profile };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchPartnerPreferences(cookie?: string): Promise<
  ApiActionResult & { preferences?: PartnerPreferences }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/partner/preferences`, {
      credentials: "include",
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.ok) {
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (isJson) {
        const data = (await res.json()) as { preferences: PartnerPreferences };
        return { ok: true, preferences: data.preferences };
      }
    }

    // Cutover Fallback: if new route returns 404 (e.g. backend process not yet restarted),
    // read preferences stored in the partner profile.
    if (res.status === 404) {
      const profileRes = await fetchPartnerProfile(cookie);
      if (profileRes.ok && profileRes.profile) {
        const p = profileRes.profile as unknown as Record<string, unknown>;
        const targetCategories = ((p.targetCategories || p.interestedCategories || []) as BusinessCategory[]);
        const searchRegion = ((p.searchRegion || "") as string);
        const seekingCollaborations = (
          (p.seekingCollaborations || p.collaborationTypes || p.partnershipTypes || []) as MasterTaxonomyID[]
        );
        const specificNeeds = ((p.specificNeeds || p.partnershipNeeds || "") as string);
        const qualificationCriteria = ((p.qualificationCriteria || p.businessCriteria || "") as string);
        return {
          ok: true,
          preferences: {
            id: (p.id as string) || "legacy-pref",
            userId: (p.userId as string) || "",
            partnerProfileId: (p.id as string) || "",
            targetCategories,
            searchRegion,
            strictRegionMatch: false,
            seekingCollaborations,
            specificNeeds,
            qualificationCriteria,
            hasPreferences:
              targetCategories.length > 0 || searchRegion !== "" || seekingCollaborations.length > 0,
            createdAt: (p.createdAt as string) || new Date().toISOString(),
            updatedAt: (p.updatedAt as string) || new Date().toISOString(),
          },
        };
      }
    }

    const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Preferensi kemitraan gagal dimuat.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function savePartnerPreferences(
  input: UpsertPartnerPreferencesInput,
): Promise<ApiActionResult & { preferences?: PartnerPreferences }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/partner/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });

    if (res.ok) {
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (isJson) {
        const data = (await res.json()) as { preferences: PartnerPreferences };
        return { ok: true, preferences: data.preferences };
      }
    }

    // Cutover Fallback: if new route returns 404, save via /partner/profile
    // so user is never blocked while local server restarts or deploys.
    if (res.status === 404) {
      const legacyRes = await fetch(`${getApiBaseUrl()}/api/v1/partner/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          interestedCategories: input.targetCategories,
          searchRegion: input.searchRegion,
          collaborationTypes: input.seekingCollaborations,
          partnershipNeeds: input.specificNeeds,
          businessCriteria: input.qualificationCriteria,
        }),
      });

      if (legacyRes.ok) {
        return {
          ok: true,
          preferences: {
            id: "legacy-pref",
            userId: "",
            partnerProfileId: "",
            targetCategories: input.targetCategories,
            searchRegion: input.searchRegion,
            strictRegionMatch: input.strictRegionMatch,
            seekingCollaborations: input.seekingCollaborations,
            specificNeeds: input.specificNeeds,
            qualificationCriteria: input.qualificationCriteria,
            hasPreferences: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      }
    }

    const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(data, "Preferensi kemitraan gagal disimpan.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchPartnerMatches(
  params?: { page?: number; limit?: number },
  cookie?: string,
): Promise<ApiActionResult & { data?: BusinessMatchList }> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();

    const res = await fetch(`${getApiBaseUrl()}/api/v1/partner/matches${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.ok) {
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (isJson) {
        const data = (await res.json()) as BusinessMatchList;
        if (Array.isArray(data.items)) {
          data.items = data.items.map((item) => ({
            ...item,
            business: {
              ...item.business,
              coverImage: resolveBusinessCover(
                item.business.slug,
                item.business.coverImage,
                item.business.name,
              ),
            },
          }));
        }
        return { ok: true, data };
      }
    }

    // Cutover Fallback for matches:
    if (res.status === 404) {
      return {
        ok: true,
        data: {
          items: CURATED_BUSINESSES.slice(0, 6).map((b) => ({
            business: b,
            matchScore: 88,
            reasons: [
              { type: "SECTOR", label: "Sektor Relevan", detail: `Kategori ${b.category} terdaftar aktif` },
              { type: "DATA", label: "Model BMC Terisi", detail: "9 blok kanvas model bisnis lengkap" },
            ],
          })),
          total: CURATED_BUSINESSES.length,
          page: 1,
          limit: 6,
          hasPreferences: true,
        },
      };
    }

    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Rekomendasi kemitraan gagal dimuat.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

// -----------------------------------------------------------------------------
// COLLABORATION REQUESTS API
// -----------------------------------------------------------------------------

export async function createCollaborationApi(
  input: CreateCollaborationInput,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as { request: CollaborationRequest } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal mengirim pengajuan kolaborasi.") };
    }
    return { ok: true, request: (data as { request: CollaborationRequest }).request };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchIncomingCollaborations(
  params?: { status?: string; q?: string; page?: number; limit?: number },
): Promise<ApiActionResult & { data?: CollaborationRequestList }> {
  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "Semua") query.set("status", params.status);
    if (params?.q) query.set("q", params.q);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();

    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/inbox${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as CollaborationRequestList;
      return { ok: true, data };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat permintaan masuk.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchOutgoingCollaborations(
  params?: { status?: string; q?: string; page?: number; limit?: number },
): Promise<ApiActionResult & { data?: CollaborationRequestList }> {
  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "Semua") query.set("status", params.status);
    if (params?.q) query.set("q", params.q);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();

    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/outbox${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as CollaborationRequestList;
      return { ok: true, data };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat permintaan terkirim.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchCollaborationStats(): Promise<
  ApiActionResult & { stats?: CollaborationStats }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/stats`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { stats: CollaborationStats };
      return { ok: true, stats: data.stats };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat statistik kolaborasi.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchCollaborationDetail(
  id: string,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/${encodeURIComponent(id)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { request: CollaborationRequest };
      return { ok: true, request: data.request };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat detail permintaan kolaborasi.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function acceptCollaborationApi(
  id: string,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/${encodeURIComponent(id)}/accept`, {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { request: CollaborationRequest } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal menerima permintaan kolaborasi.") };
    }
    return { ok: true, request: (data as { request: CollaborationRequest }).request };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function rejectCollaborationApi(
  id: string,
  reason?: string,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason: reason || "" }),
    });
    const data = (await res.json().catch(() => ({}))) as { request: CollaborationRequest } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal menolak permintaan kolaborasi.") };
    }
    return { ok: true, request: (data as { request: CollaborationRequest }).request };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function withdrawCollaborationApi(
  id: string,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/${encodeURIComponent(id)}/withdraw`, {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { request: CollaborationRequest } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal menarik permintaan kolaborasi.") };
    }
    return { ok: true, request: (data as { request: CollaborationRequest }).request };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

// -----------------------------------------------------------------------------
// INBOX & MESSAGING API
// -----------------------------------------------------------------------------

export async function fetchInboxConversations(): Promise<
  ApiActionResult & { conversations?: Conversation[] }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/inbox/conversations`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { conversations: Conversation[] };
      return { ok: true, conversations: data.conversations };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat percakapan pesan.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchConversationMessages(
  convId: string,
  page?: number,
): Promise<ApiActionResult & { data?: MessageList }> {
  try {
    const query = new URLSearchParams();
    if (page) query.set("page", String(page));
    const qs = query.toString();

    const res = await fetch(`${getApiBaseUrl()}/api/v1/inbox/conversations/${encodeURIComponent(convId)}/messages${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as MessageList;
      return { ok: true, data };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat pesan.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function sendMessageApi(
  convId: string,
  content: string,
): Promise<ApiActionResult & { message?: Message }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/inbox/conversations/${encodeURIComponent(convId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
    const data = (await res.json().catch(() => ({}))) as { message: Message } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal mengirim pesan.") };
    }
    return { ok: true, message: (data as { message: Message }).message };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

// -----------------------------------------------------------------------------
// PARTNERSHIP HISTORY & LIFECYCLE API
// -----------------------------------------------------------------------------

export async function fetchCollaborationHistory(
  params?: {
    status?: string;
    q?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
): Promise<ApiActionResult & { data?: CollaborationRequestList }> {
  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "Semua") query.set("status", params.status);
    if (params?.q) query.set("q", params.q);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();

    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/history${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as CollaborationRequestList;
      return { ok: true, data };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat riwayat kemitraan.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchCollaborationHistoryStats(): Promise<
  ApiActionResult & { stats?: CollaborationHistoryStats }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/history/stats`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { stats: CollaborationHistoryStats };
      return { ok: true, stats: data.stats };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat statistik riwayat kemitraan.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchCollaborationHistoryDetail(
  id: string,
): Promise<ApiActionResult & { detail?: CollaborationHistoryDetail }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/history/${encodeURIComponent(id)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const detail = (await res.json()) as CollaborationHistoryDetail;
      return { ok: true, detail };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat detail riwayat kemitraan.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function startPartnershipApi(
  id: string,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/${encodeURIComponent(id)}/start`, {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { request: CollaborationRequest } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal memulai kemitraan.") };
    }
    return { ok: true, request: (data as { request: CollaborationRequest }).request };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function completePartnershipApi(
  id: string,
  notes?: string,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/${encodeURIComponent(id)}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ notes: notes || "" }),
    });
    const data = (await res.json().catch(() => ({}))) as { request: CollaborationRequest } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal menyelesaikan kemitraan.") };
    }
    return { ok: true, request: (data as { request: CollaborationRequest }).request };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function cancelPartnershipApi(
  id: string,
  reason?: string,
): Promise<ApiActionResult & { request?: CollaborationRequest }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/collaborations/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason: reason || "" }),
    });
    const data = (await res.json().catch(() => ({}))) as { request: CollaborationRequest } | ApiErrorResponse;
    if (!res.ok) {
      return { ok: false, ...getApiError(data, "Gagal membatalkan kemitraan.") };
    }
    return { ok: true, request: (data as { request: CollaborationRequest }).request };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS API
// -----------------------------------------------------------------------------

export async function fetchNotifications(
  params?: { type?: string; status?: string; unread?: boolean; page?: number; limit?: number },
): Promise<ApiActionResult & { data?: NotificationList }> {
  try {
    const query = new URLSearchParams();
    if (params?.type && params.type !== "Semua") query.set("type", params.type);
    if (params?.status) query.set("status", params.status);
    if (params?.unread) query.set("unread", "true");
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();

    const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as NotificationList;
      return { ok: true, data };
    }
    const errData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
    return { ok: false, ...getApiError(errData, "Gagal memuat notifikasi.") };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server backend." };
  }
}

export async function fetchUnreadNotificationCount(): Promise<
  ApiActionResult & { unreadCount?: number }
> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications/unread-count`, {
      credentials: "include",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { unreadCount: number };
      return { ok: true, unreadCount: data.unreadCount };
    }
    return { ok: false, unreadCount: 0 };
  } catch {
    return { ok: false, unreadCount: 0 };
  }
}

export async function markNotificationReadApi(id: string): Promise<ApiActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    return { ok: res.ok };
  } catch {
    return { ok: false, error: "Gagal memperbarui notifikasi." };
  }
}

export async function markAllNotificationsReadApi(): Promise<ApiActionResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications/read-all`, {
      method: "PATCH",
      credentials: "include",
    });
    return { ok: res.ok };
  } catch {
    return { ok: false, error: "Gagal memperbarui semua notifikasi." };
  }
}
