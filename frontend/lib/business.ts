import type { Business } from "@/types/business";

/**
 * Peta aset visual kurasi riil dari direktori `frontend/public/asset lumora/`
 * Menghubungkan setiap UMKM seed dan profil resmi platform dengan foto asli.
 */
export const CURATED_BUSINESS_COVERS: Record<string, string> = {
  "aksara-lokal": "/asset%20lumora/aksara%20lokal.jpg",
  "arunika-bakery": "/asset%20lumora/arunika%20bakery.jpg",
  "bengkel-sahabat": "/asset%20lumora/bengkel%20sahabat.jpg",
  "dapur-nusa": "/asset%20lumora/dapur%20nusa.jpg",
  "kayu-rupa": "/asset%20lumora/kayu%20rupa.jpg",
  "kopi-ruang-senja": "/asset%20lumora/kopi%20ruang%20senja.jpg",
  "nara-studio": "/asset%20lumora/nara%20studio.jpg",
  "sora-craft": "/asset%20lumora/sora%20craft.jpg",
  "tumbuh-toko": "/asset%20lumora/tumbuh%20toko.jpg",
};

export const CURATED_OWNER_AVATARS: Record<string, string> = {
  "arunika-bakery": "/asset%20lumora/user%20arunika%20bakery.jpg",
  "kopi-ruang-senja": "/asset%20lumora/user%20kopi%20ruang%20senja.jpg",
  "nara-studio": "/asset%20lumora/user%20nara%20studio%20busana.jpg",
};

/**
 * Mengembalikan URL gambar cover spesifik dari folder `/asset lumora/`
 * Jika bisnis memiliki foto kurasi spesifik atau jika cover saat ini masih
 * berupa placeholder generik (/img/benner.png atau /img/image.png).
 */
export function resolveBusinessCover(
  slug?: string | null,
  coverImage?: string | null,
  name?: string | null
): string | undefined {
  const normalizedSlug = slug?.toLowerCase().trim() || "";
  const normalizedName = name?.toLowerCase().trim() || "";

  // 1. Cek langsung dari pemetaan slug
  if (normalizedSlug && CURATED_BUSINESS_COVERS[normalizedSlug]) {
    const curated = CURATED_BUSINESS_COVERS[normalizedSlug];
    if (
      !coverImage ||
      coverImage === "/img/benner.png" ||
      coverImage === "/img/image.png" ||
      coverImage.includes("asset%20lumora") ||
      coverImage.includes("asset lumora")
    ) {
      return curated;
    }
  }

  // 2. Cek berdasarkan kemiripan nama usaha (fallback jika slug memiliki format lain)
  for (const [key, path] of Object.entries(CURATED_BUSINESS_COVERS)) {
    const keyWords = key.replace(/-/g, " ");
    if (
      (normalizedSlug && normalizedSlug.includes(key)) ||
      (normalizedName && normalizedName.includes(keyWords))
    ) {
      if (
        !coverImage ||
        coverImage === "/img/benner.png" ||
        coverImage === "/img/image.png" ||
        coverImage.includes("asset%20lumora") ||
        coverImage.includes("asset lumora")
      ) {
        return path;
      }
    }
  }

  return coverImage?.trim() || undefined;
}

/**
 * Business age as a label, derived from the founding year rather than stored, so
 * it cannot silently go stale in the data file.
 */
export function businessAge(foundedYear: number, now: Date = new Date()): string {
  const years = now.getFullYear() - foundedYear;
  if (years <= 0) return "Baru berdiri";
  return `${years} tahun berjalan`;
}

export function businessInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export type { Business };
