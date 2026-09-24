import { ROUTES } from "@/lib/constants";
import { BUSINESS_CATEGORIES } from "@/types/business";

/**
 * Landing page copy, kept out of the section components so wording can change
 * without touching layout (PRD 14).
 *
 * Two things were adjusted from the PRD, both recorded here so the difference is
 * not mistaken for a transcription error:
 *
 * 1. The problem section's `86,74%` statistic is gone. The PRD asked for a
 *    source label, and no source exists, so the number was removed rather than
 *    given a citation it does not have (R-17). `problemStatement` carries the
 *    same point as a qualitative claim instead.
 * 2. Nothing here claims a user count, a testimonial, or a partnership. Those
 *    would be fabricated, and the PRD's social proof section explicitly allows
 *    leaving them out (PRD 10.11, R-38).
 */

export interface ProblemItem {
  title: string;
  body: string;
}

export const problemSection = {
  eyebrow: "Masalah yang Ada",
  heading: "Banyak UMKM potensial belum mendapatkan kesempatan untuk terlihat.",
  statement:
    "Hambatannya biasanya bukan mutu usaha, melainkan hal yang lebih mendasar: catatan yang masih tersebar, dokumentasi yang belum rapi, dan tidak adanya tempat untuk menceritakan bagaimana usaha itu tumbuh. Tanpa itu, bisnis yang sebenarnya berjalan baik sulit dinilai oleh orang luar.",
} as const;

export const problemItems: ProblemItem[] = [
  {
    title: "Administrasi menjadi hambatan",
    body: "Usaha mikro sering belum memiliki dokumentasi bisnis yang dibutuhkan platform formal.",
  },
  {
    title: "Potensi sulit terlihat",
    body: "Bisnis yang berkembang secara lokal belum tentu memiliki media untuk menceritakan perkembangan usahanya.",
  },
  {
    title: "Data masih sederhana",
    body: "Informasi bisnis sering tersebar dalam catatan manual dan sulit disajikan kepada calon mitra.",
  },
];

export interface ValueItem {
  /** Kept as a string so the marker can be a number, a year, or a short label. */
  marker: string;
  title: string;
  body: string;
}

export const valueSection = {
  heading: "Dari cerita sederhana menjadi profil bisnis yang lebih meyakinkan.",
} as const;

export const valueItems: ValueItem[] = [
  {
    marker: "01",
    title: "Ceritakan Bisnismu",
    body: "Pemilik UMKM memasukkan informasi sederhana tentang usaha dan perjalanan bisnisnya.",
  },
  {
    marker: "02",
    title: "Susun dengan Bantuan AI",
    body: "AI membantu membuat draf profil dan Business Model Canvas yang tetap dapat diedit pengguna.",
  },
  {
    marker: "03",
    title: "Ditemukan Mitra",
    body: "Profil masuk ke discovery hub sehingga calon mitra dapat mempelajari bisnis tersebut.",
  },
];

export interface FlowStep {
  title: string;
  body: string;
}

export const howItWorksSection = {
  heading: "Cara kerja LUMORA untuk kedua sisi.",
  description:
    "Dua alur yang berbeda untuk dua kebutuhan yang berbeda. Pilih sisi yang ingin kamu lihat.",
} as const;

export const umkmFlow: FlowStep[] = [
  { title: "Buat akun", body: "Isi informasi dasar tentang usaha." },
  {
    title: "Bangun profil",
    body: "Ceritakan bisnis, produk, perjalanan, dan kebutuhan yang sedang dicari.",
  },
  { title: "Dibantu AI", body: "Susun draf profil dan Business Model Canvas." },
  { title: "Publikasikan", body: "Profil tampil di discovery hub." },
  {
    title: "Terhubung",
    body: "Calon mitra dapat menemukan dan menghubungi UMKM.",
  },
];

export const investorFlow: FlowStep[] = [
  { title: "Jelajahi", body: "Cari bisnis berdasarkan kategori." },
  { title: "Pelajari", body: "Buka profil bisnis yang menarik perhatian." },
  { title: "Pahami", body: "Lihat perjalanan bisnis dan data perkembangannya." },
  {
    title: "Gunakan AI",
    body: "Dapatkan ringkasan dari informasi yang tersedia.",
  },
  { title: "Hubungi", body: "Mulai percakapan dengan pemilik bisnis." },
];

export const discoverySection = {
  eyebrow: "Temukan Bisnis",
  heading: "Temukan cerita bisnis yang layak untuk dikenal.",
  description:
    "Jelajahi UMKM dari berbagai kategori dan lihat bagaimana mereka tumbuh.",
  demoNote:
    "Semua profil di bawah ini adalah contoh untuk pratinjau, bukan data bisnis nyata.",
  emptyState:
    "Belum ada profil contoh pada kategori ini. Pilih kategori lain untuk melanjutkan.",
} as const;

/**
 * The filter list is derived from the category union rather than typed out, so a
 * category can never be filterable without also existing in the data model.
 */
export const discoveryFilters = ["Semua", ...BUSINESS_CATEGORIES] as const;

export type DiscoveryFilter = (typeof discoveryFilters)[number];

export const finalCta = {
  heading: "Setiap bisnis punya cerita yang layak untuk ditemukan.",
  description:
    "Mulai bangun profil bisnismu, atau temukan UMKM yang menarik untuk kamu kenal lebih jauh.",
} as const;

/* -------------------------------------------------------------------------
   PRD 10.7, the AI feature section.
   ------------------------------------------------------------------------- */

export const aiSection = {
  eyebrow: "Lumora AI",
  heading: "AI yang membantu, bukan mengambil keputusan.",
  description:
    "AI di LUMORA menyusun draf dan merangkum informasi yang sudah ada. Pemilik bisnis tetap memeriksa dan mengedit setiap hasilnya, dan tidak ada penilaian kelayakan yang dibuat otomatis.",
  /**
   * PRD 10.7 names four claims the AI must never make. They are listed on screen
   * rather than hidden in a policy page: the section's whole argument is that the
   * AI does not judge, so saying what it refuses to say is the argument.
   */
  guardrailTitle: "Yang tidak pernah dilakukan AI di LUMORA",
  guardrails: [
    "Menyatakan sebuah usaha pasti menguntungkan.",
    "Menyebut sebuah usaha sebagai investasi terbaik.",
    "Menilai risiko sebuah usaha sebagai rendah.",
    "Menyatakan sebuah usaha layak dibeli.",
  ],
  previewBadge: "Pratinjau fitur",
  previewNote: "Contoh isian di bawah ini, bukan percakapan nyata.",
} as const;

export const aiProfileAssistant = {
  audience: "Untuk UMKM",
  title: "Asisten Profil dan Business Model Canvas",
  body: "Jawaban sederhana dari pemilik usaha disusun menjadi draf profil dan kanvas model bisnis yang tetap dapat diedit.",
  inputLabel: "Yang diketik pemilik usaha",
  inputText:
    "Saya buka kedai kopi di Bandung sejak 2023. Pelanggannya warga sekitar, dan sekarang sedang mencari mitra untuk membuka cabang kedua.",
  outputLabel: "Draf yang dihasilkan",
  capabilities: [
    "Mengubah jawaban sederhana menjadi draf profil.",
    "Membantu menyusun proposisi nilai.",
    "Menyusun draf Business Model Canvas.",
    "Memberi saran struktur penulisan.",
  ],
  editNote: "Semua hasil dapat diedit pemilik bisnis.",
} as const;

export const aiDiscoveryAssistant = {
  audience: "Untuk Pemodal",
  title: "Asisten Penelusuran Bisnis",
  body: "Pemodal mencari dengan kalimat biasa, lalu AI merangkum profil yang sesuai dengan filter tersebut.",
  promptLabel: "Contoh pertanyaan",
  prompt: "Tampilkan UMKM F&B di Bandung dengan pertumbuhan positif.",
  responseLabel: "Ringkasan yang diberikan",
  responseIntro: "Saya menemukan beberapa profil yang sesuai dengan filter tersebut.",
  responseNote: "Ringkasan hanya memuat informasi yang sudah ada di profil.",
} as const;

/* -------------------------------------------------------------------------
   PRD 10.8, the profile showcase.
   ------------------------------------------------------------------------- */

export const profileShowcase = {
  eyebrow: "Profil Bisnis",
  heading: "Satu profil. Seluruh cerita bisnis.",
  description:
    "Profil LUMORA menyusun informasi sebuah usaha dalam satu halaman yang bisa dibaca berurutan, dari cerita pemiliknya sampai kebutuhan yang sedang dicari.",
  note: "Pratinjau fitur. Seluruh isi profil di bawah ini adalah data contoh.",
} as const;

/* -------------------------------------------------------------------------
   PRD 10.9, the business journey.
   ------------------------------------------------------------------------- */

export const journeySection = {
  heading: "Bukan hanya angka. Lihat perjalanan di balik bisnisnya.",
  description:
    "Angka menunjukkan hasil akhir, bukan prosesnya. LUMORA menyimpan tonggak perjalanan sebuah usaha, supaya calon mitra bisa melihat bagaimana bisnis itu sampai di titik sekarang.",
  note: "Contoh perjalanan dengan data ilustrasi.",
} as const;

/* -------------------------------------------------------------------------
   PRD 10.10, the dual persona section.
   ------------------------------------------------------------------------- */

export interface PersonaCard {
  /** Drives which card is treated as primary, so the variant is not in the data. */
  key: "umkm" | "investor";
  audience: string;
  heading: string;
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const personaSection = {
  heading: "Satu platform, dua cara memakainya.",
  description:
    "Pemilik usaha dan calon mitra datang dengan kebutuhan yang berbeda, jadi LUMORA menyiapkan alur untuk masing-masing.",
} as const;

export const personaCards: PersonaCard[] = [
  {
    key: "umkm",
    audience: "Pelaku UMKM",
    heading: "Buat bisnismu lebih mudah ditemukan.",
    benefits: [
      "Profil bisnis yang tersusun rapi",
      "Asisten profil dan kanvas model bisnis",
      "Perjalanan bisnis yang tercatat",
      "Terlihat oleh calon mitra",
    ],
    ctaLabel: "Mulai Buat Profil",
    ctaHref: ROUTES.registerUmkm,
  },
  {
    key: "investor",
    audience: "Pemodal dan Mitra",
    heading: "Temukan bisnis yang ingin kamu kenal lebih jauh.",
    benefits: [
      "Discovery hub dengan filter kategori",
      "Profil bisnis yang bisa dibaca berurutan",
      "Ringkasan AI atas informasi yang tersedia",
      "Perjalanan bisnis dan indikator perkembangannya",
    ],
    ctaLabel: "Mulai Menjelajah",
    ctaHref: ROUTES.explore,
  },
];

/* -------------------------------------------------------------------------
   PRD 3, 5 and 10.11, the about and social proof section.
   ------------------------------------------------------------------------- */

export const aboutSection = {
  heading: "Apa LUMORA dan apa yang tidak LUMORA lakukan.",
  statement:
    "LUMORA adalah platform digital pitching dan discovery. Tugasnya membantu UMKM mengubah cerita, data sederhana, dan perjalanan usaha mereka menjadi profil digital yang lebih mudah ditemukan calon mitra dan pemodal.",
  isTitle: "LUMORA adalah",
  isItems: [
    "Platform digital pitching untuk UMKM",
    "Discovery hub bagi calon mitra dan pemodal",
    "Alat bantu penyusunan profil dan Business Model Canvas",
  ],
  isNotTitle: "LUMORA bukan",
  /**
   * PRD 3 lists what the product is not, and PRD 5 lists the non-goals. Together
   * they are the most trust-building content on the page: a platform that says
   * plainly what it refuses to do is easier to believe about what it does.
   */
  isNotItems: [
    "Platform crowdfunding",
    "Payment gateway atau layanan escrow",
    "Marketplace saham",
    "Pemberi rekomendasi investasi",
    "Pengganti legal due diligence",
    "Sistem penilaian yang menyatakan sebuah usaha layak investasi",
  ],
  socialProof: {
    title: "Dibangun untuk mendukung pelaku usaha lokal.",
    body: "Kategori usaha yang sudah ada di discovery hub:",
  },
} as const;

/* -------------------------------------------------------------------------
   PRD 10.12, the FAQ.
   ------------------------------------------------------------------------- */

export const faqSection = {
  heading: "Pertanyaan yang sering diajukan.",
  description:
    "Jawaban singkat untuk hal yang paling sering ditanyakan sebelum mulai.",
} as const;
