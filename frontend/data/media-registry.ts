/**
 * Registry aset statis platform LUMORA yang telah diverifikasi pada repositori.
 * Aset ini tersimpan secara fisik di direktori `frontend/public/`
 * (subfolder `img`, `asset lumora`, dan `vid`).
 *
 * Ukuran byte dan nama berkas dicatat persis sesuai metadata filesystem riil.
 */

export type MediaCategory =
  | "brand"
  | "banner"
  | "curated_umkm"
  | "video"
  | "upload";

export interface MediaAsset {
  id: string;
  name: string;
  filename: string;
  path: string;
  category: MediaCategory;
  mimeType: string;
  sizeBytes: number;
  description: string;
  usageLocation: string;
  isStaticRepo: boolean;
  uploadedAt?: string;
}

export const CATEGORY_LABELS: Record<MediaCategory, { label: string; tone: string }> = {
  brand: { label: "Brand & Identitas", tone: "bg-[#123f32] text-white" },
  banner: { label: "CMS Beranda & Banner", tone: "bg-[#b7df68] text-[#123f32]" },
  curated_umkm: { label: "Kurasi UMKM", tone: "bg-[#e7efe9] text-[#123f32]" },
  video: { label: "Media Video", tone: "bg-[#f5f2e9] text-[#526059]" },
  upload: { label: "Unggahan Sesi Ini", tone: "bg-[#123f32]/10 text-[#123f32]" },
};

export const STATIC_MEDIA_REGISTRY: MediaAsset[] = [
  // --- ASET IDENTITAS & BRANDING (public/img/) ---
  {
    id: "brand-logo-nav",
    name: "Logo Navbar Ringkas",
    filename: "logo-nav.png",
    path: "/img/logo-nav.png",
    category: "brand",
    mimeType: "image/png",
    sizeBytes: 294358,
    description: "Logo utama navbar dengan lambang daun dan kata LUMORA, dioptimalkan tanpa tagline untuk tampilan tajam di layar kecil.",
    usageLocation: "Navbar publik dan navigasi utama aplikasi (komponen Logo)",
    isStaticRepo: true,
  },
  {
    id: "brand-logo-light",
    name: "Logo Putih (Knockout)",
    filename: "logo-light.png",
    path: "/img/logo-light.png",
    category: "brand",
    mimeType: "image/png",
    sizeBytes: 77969,
    description: "Logo varian monokrom putih untuk kontras tinggi pada latar belakang gelap (forest green).",
    usageLocation: "Footer website dan section bertema gelap",
    isStaticRepo: true,
  },
  {
    id: "brand-logo-symbol",
    name: "Simbol Daun LUMORA",
    filename: "logo-symbol.png",
    path: "/img/logo-symbol.png",
    category: "brand",
    mimeType: "image/png",
    sizeBytes: 136079,
    description: "Ikon tunggal daun LUMORA untuk ruang kompak dan sidebar saat diringkas (collapsed).",
    usageLocation: "Workspace sidebar (mode ikon), favicon, dan identitas kompak",
    isStaticRepo: true,
  },
  {
    id: "brand-logo-full",
    name: "Logo Lengkap dengan Tagline",
    filename: "logo-full.png",
    path: "/img/logo-full.png",
    category: "brand",
    mimeType: "image/png",
    sizeBytes: 342446,
    description: "Logo lockup resmi menyertakan tagline 'BISNIS KECIL, PELUANG BESAR' dalam resolusi tinggi.",
    usageLocation: "Materi presentasi, kartu OpenGraph, dan dokumen resmi platform",
    isStaticRepo: true,
  },
  {
    id: "brand-logo-standard",
    name: "Logo Standar",
    filename: "logo.png",
    path: "/img/logo.png",
    category: "brand",
    mimeType: "image/png",
    sizeBytes: 342921,
    description: "Aset logo standar platform dengan rasio aspek orisinal.",
    usageLocation: "Aset identitas umum dan fallback rute favicon (/favicon.ico)",
    isStaticRepo: true,
  },
  {
    id: "brand-social-banner",
    name: "Banner Media Sosial LUMORA",
    filename: "lumora-social-banner.png",
    path: "/img/lumora-social-banner.png",
    category: "brand",
    mimeType: "image/png",
    sizeBytes: 840017,
    description: "Banner landscape untuk kartu tautan media sosial dan pratinjau tautan WhatsApp/Twitter.",
    usageLocation: "Metadata OpenGraph & Twitter Card",
    isStaticRepo: true,
  },

  // --- ASET CMS BERANDA & BANNER (public/img/) ---
  {
    id: "banner-hero-fallback",
    name: "Banner Fallback Hero Beranda",
    filename: "benner.png",
    path: "/img/benner.png",
    category: "banner",
    mimeType: "image/png",
    sizeBytes: 2493400,
    description: "Visual suasana kedai kopi untuk fallback Hero landing page jika belum ada profil UMKM terbit, serta cover profil Kopi Ruang Senja & Nara Studio.",
    usageLocation: "Hero Section Beranda & Cover Profil Seed UMKM (Kopi Ruang Senja, Nara Studio)",
    isStaticRepo: true,
  },
  {
    id: "banner-cover-secondary",
    name: "Cover Profil Sekunder (Dapur/Bakery)",
    filename: "image.png",
    path: "/img/image.png",
    category: "banner",
    mimeType: "image/png",
    sizeBytes: 2347962,
    description: "Visual kegiatan dapur dan produksi roti untuk cover profil UMKM pangan & kerajinan lokal.",
    usageLocation: "Cover Profil Seed UMKM (Arunika Bakery, Kayu Rupa)",
    isStaticRepo: true,
  },

  // --- ASET VIDEO PROMOSI (public/vid/) ---
  {
    id: "video-launch",
    name: "Video Peluncuran LUMORA",
    filename: "LumoraLaunch.mp4",
    path: "/vid/LumoraLaunch.mp4",
    category: "video",
    mimeType: "video/mp4",
    sizeBytes: 6697938,
    description: "Video teaser animasi peluncuran platform ekosistem kemitraan UMKM LUMORA.",
    usageLocation: "Media promosi platform & pengenalan ekosistem",
    isStaticRepo: true,
  },

  // --- ASET KURASI UMKM LOKAL (public/asset lumora/) ---
  {
    id: "umkm-aksara-lokal",
    name: "Aksara Lokal — Studio Desain & Cetak",
    filename: "aksara lokal.jpg",
    path: "/asset%20lumora/aksara%20lokal.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3280149,
    description: "Dokumentasi visual proses percetakan dan kreasi alat tulis Aksara Lokal.",
    usageLocation: "Koleksi visual profil kategori Kreatif & Desain",
    isStaticRepo: true,
  },
  {
    id: "umkm-arunika-bakery",
    name: "Arunika Bakery — Suasana Dapur Roti",
    filename: "arunika bakery.jpg",
    path: "/asset%20lumora/arunika%20bakery.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3263132,
    description: "Visual panggangan roti segar setiap pagi dari dapur rumahan Arunika Bakery.",
    usageLocation: "Koleksi visual profil kategori F&B (Bakery)",
    isStaticRepo: true,
  },
  {
    id: "umkm-bengkel-sahabat",
    name: "Bengkel Sahabat — Layanan Servis",
    filename: "bengkel sahabat.jpg",
    path: "/asset%20lumora/bengkel%20sahabat.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3374157,
    description: "Dokumentasi bengkel mekanik independen yang melayani perawatan kendaraan warga.",
    usageLocation: "Koleksi visual profil kategori Jasa Otomotif",
    isStaticRepo: true,
  },
  {
    id: "umkm-dapur-nusa",
    name: "Dapur Nusa — Masakan Rempah Tradisional",
    filename: "dapur nusa.jpg",
    path: "/asset%20lumora/dapur%20nusa.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3540916,
    description: "Visual hidangan nusantara berbasis bahan baku segar dari pasar lokal.",
    usageLocation: "Koleksi visual profil kategori F&B (Kuliner Nusantara)",
    isStaticRepo: true,
  },
  {
    id: "umkm-kayu-rupa",
    name: "Kayu Rupa — Workshop Kerajinan Kayu",
    filename: "kayu rupa.jpg",
    path: "/asset%20lumora/kayu%20rupa.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3477063,
    description: "Pengolahan kayu potongan menjadi perkakas rumah tangga berestetika tinggi.",
    usageLocation: "Koleksi visual profil kategori Kreatif (Woodcraft)",
    isStaticRepo: true,
  },
  {
    id: "umkm-kopi-ruang-senja",
    name: "Kopi Ruang Senja — Kedai Komunitas",
    filename: "kopi ruang senja.jpg",
    path: "/asset%20lumora/kopi%20ruang%20senja.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3498315,
    description: "Suasana ruang singgah hangat tempat kopi, percakapan, dan ide bertemu.",
    usageLocation: "Koleksi visual profil kategori F&B (Coffee Shop)",
    isStaticRepo: true,
  },
  {
    id: "umkm-nara-studio",
    name: "Nara Studio — Studio Busana Berkelanjutan",
    filename: "nara studio.jpg",
    path: "/asset%20lumora/nara%20studio.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3266247,
    description: "Visual proses perancangan busana made-to-order bersama penjahit lokal.",
    usageLocation: "Koleksi visual profil kategori Fashion & Apparel",
    isStaticRepo: true,
  },
  {
    id: "umkm-sora-craft",
    name: "Sora Craft — Studio Keramik Manual",
    filename: "sora craft.jpg",
    path: "/asset%20lumora/sora%20craft.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3667411,
    description: "Proses pembentukan keramik tanah liat dengan teknik tangan tradisional.",
    usageLocation: "Koleksi visual profil kategori Kreatif & Kerajinan",
    isStaticRepo: true,
  },
  {
    id: "umkm-tumbuh-toko",
    name: "Tumbuh Toko — Gerai Produk Ramah Lingkungan",
    filename: "tumbuh toko.jpg",
    path: "/asset%20lumora/tumbuh%20toko.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3240720,
    description: "Pajangan etalase produk konsumsi berkelanjutan dan kebutuhan rumah tangga curah.",
    usageLocation: "Koleksi visual profil kategori Retail (Eco Store)",
    isStaticRepo: true,
  },
  {
    id: "umkm-user-arunika",
    name: "Pendiri Arunika Bakery (Nadia Permata)",
    filename: "user arunika bakery.jpg",
    path: "/asset%20lumora/user%20arunika%20bakery.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 2547688,
    description: "Potret pemilik dan baker utama di balik pertumbuhan Arunika Bakery.",
    usageLocation: "Foto profil pemilik usaha pada business showcase",
    isStaticRepo: true,
  },
  {
    id: "umkm-user-kopi-ruang-senja",
    name: "Pendiri Kopi Ruang Senja (Raka Pradana)",
    filename: "user kopi ruang senja.jpg",
    path: "/asset%20lumora/user%20kopi%20ruang%20senja.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 2930324,
    description: "Potret pengelola kedai kopi yang mengembangkan menu dan kegiatan komunitas.",
    usageLocation: "Foto profil pemilik usaha pada business showcase",
    isStaticRepo: true,
  },
  {
    id: "umkm-user-nara-studio",
    name: "Pendiri Nara Studio (Nara Ayuningtyas)",
    filename: "user nara studio busana.jpg",
    path: "/asset%20lumora/user%20nara%20studio%20busana.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 2758771,
    description: "Potret desainer dan pendiri studio busana dengan pendekatan made-to-order.",
    usageLocation: "Foto profil pemilik usaha pada business showcase",
    isStaticRepo: true,
  },
  {
    id: "umkm-auth-login",
    name: "Foto Halaman Masuk (Login)",
    filename: "foto pages login.jpg",
    path: "/asset%20lumora/foto%20pages%20login.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3062253,
    description: "Visual etalase UMKM pendukung pada sisi kiri formulir masuk akun.",
    usageLocation: "Visual pendukung halaman /login",
    isStaticRepo: true,
  },
  {
    id: "umkm-auth-register",
    name: "Foto Halaman Pendaftaran (Register)",
    filename: "foto pages register.jpg",
    path: "/asset%20lumora/foto%20pages%20register.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 3210617,
    description: "Visual pengrajin lokal pendukung pada sisi formulir pendaftaran mitra/UMKM.",
    usageLocation: "Visual pendukung halaman /register",
    isStaticRepo: true,
  },
  {
    id: "umkm-social-banner-curated",
    name: "Banner Kolaborasi Pelaku Usaha",
    filename: "social banner.jpg",
    path: "/asset%20lumora/social%20banner.jpg",
    category: "curated_umkm",
    mimeType: "image/jpeg",
    sizeBytes: 2186290,
    description: "Visual gabungan aktivitas pelaku usaha lokal untuk promosi kemitraan.",
    usageLocation: "Banner kampanye & media sosial promosi kemitraan",
    isStaticRepo: true,
  },
];

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
