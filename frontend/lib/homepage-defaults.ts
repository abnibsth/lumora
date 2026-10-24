import type { HomepageContent } from "@/types/homepage";

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  schemaVersion: 1,

  hero: {
    wordmark: "LUMORA",
    headingLead: "Tumbuh bersama",
    headingEmphasis: "UMKM Indonesia.",
    description:
      "Kenalkan cerita usahamu, tunjukkan perjalanannya, dan buka ruang untuk peluang kemitraan.",
    primaryCta: {
      label: "Mulai Sekarang",
      href: "/register?role=umkm",
    },
    secondaryCta: {
      label: "Jelajahi UMKM",
      href: "#jelajahi-umkm",
    },
    footnote: "Profil bisnis. Cerita pemilik. Peluang untuk terhubung.",
    fallbackImage: {
      src: "/img/benner.png",
      alt: "Ilustrasi pelaku usaha di kedai kopi",
      caption: "Setiap usaha dimulai dari sebuah cerita.",
      disclosure: "Visual ilustrasi, bukan profil bisnis terdaftar.",
    },
  },

  value: {
    visible: true,
    eyebrow: "Untuk usaha lokal Indonesia",
    headingLead: "Usahamu punya cerita.",
    headingEmphasis: "Beri ruang untuk dikenal.",
    description:
      "LUMORA membantu pemilik UMKM menyusun profil dan perjalanan usahanya agar calon mitra dapat mempelajari bisnis dari informasi yang dibagikan pemiliknya.",
    points: [
      {
        title: "Lebih mudah diperkenalkan",
        body: "Cerita, produk, dan kebutuhan usahamu tersusun dalam satu profil digital yang dapat dibagikan.",
      },
      {
        title: "Lebih mudah dipahami",
        body: "Business Model Canvas membantu menjelaskan bagaimana usaha berjalan, dari pelanggan hingga struktur biaya.",
      },
      {
        title: "Lebih mudah ditemukan",
        body: "Calon mitra dapat menelusuri profil dan mengenal perjalanan usaha sebelum memulai percakapan.",
      },
    ],
  },

  discovery: {
    visible: true,
    eyebrow: "Temukan Bisnis",
    heading: "Temukan cerita bisnis yang layak untuk dikenal.",
    description:
      "Jelajahi UMKM dari berbagai kategori dan lihat bagaimana mereka tumbuh.",
    cta: {
      label: "Jelajahi Semua Bisnis",
      href: "/explore",
    },
  },

  features: {
    visible: true,
    eyebrow: "Fitur LUMORA",
    headingLead: "Satu tempat untuk",
    headingEmphasis: "merapikan cerita usahamu.",
    description:
      "Kenalkan bisnis dengan informasi yang lebih lengkap. Mulai dari profil dan model bisnis, hingga perjalanan yang ingin kamu bagikan.",
    primaryCta: {
      label: "Buat profil usahamu",
      href: "/register?role=umkm",
    },
    secondaryLink: {
      label: "Coba asisten LUMORA AI",
      href: "#fitur",
    },
    items: [
      {
        title: "Profil bisnis digital",
        description:
          "Satukan cerita pemilik, produk, lokasi, dan kebutuhan kemitraan dalam satu profil yang dapat dibaca calon mitra.",
      },
      {
        title: "Business Model Canvas",
        description:
          "Susun sembilan bagian model bisnis dengan panduan dan bantuan draf AI. Periksa dan edit hasilnya sesuai kondisi usahamu.",
      },
      {
        title: "Jelajah usaha lokal",
        description:
          "Telusuri profil UMKM, pilih kategori usaha, lalu pelajari bisnis yang ingin kamu kenal lebih jauh.",
      },
      {
        title: "Catatan perjalanan usaha",
        description:
          "Simpan tonggak perkembangan bisnis beserta tahunnya, sehingga calon mitra dapat mengikuti proses di balik usaha tersebut.",
      },
    ],
  },

  journey: {
    visible: true,
    eyebrow: "Cerita & Perjalanan Usaha",
    headingLead: "Kenali proses di balik",
    headingEmphasis: "usahanya.",
    description:
      "Angka menunjukkan hasil akhir, bukan prosesnya. LUMORA menyimpan tonggak perjalanan sebuah usaha, supaya calon mitra bisa melihat bagaimana bisnis itu sampai di titik sekarang.",
  },

  howItWorks: {
    visible: true,
    eyebrow: "Cara kerja",
    heading: "Cara kerja LUMORA untuk kedua sisi.",
    description:
      "Dua alur yang berbeda untuk dua kebutuhan yang berbeda. Pilih sisi yang ingin kamu lihat.",
    umkmLabel: "Pelaku UMKM",
    partnerLabel: "Mitra & Pemodal",
    umkmSteps: [
      { title: "Buat akun", body: "Isi informasi dasar tentang usaha." },
      {
        title: "Bangun profil",
        body: "Ceritakan bisnis, produk, perjalanan, dan kebutuhan yang sedang dicari.",
      },
      {
        title: "Dibantu AI",
        body: "Susun draf profil dan Business Model Canvas.",
      },
      { title: "Publikasikan", body: "Profil tampil di discovery hub." },
      {
        title: "Terhubung",
        body: "Calon mitra dapat menemukan dan menghubungi UMKM.",
      },
    ],
    partnerSteps: [
      { title: "Jelajahi", body: "Cari bisnis berdasarkan kategori." },
      {
        title: "Pelajari",
        body: "Buka profil bisnis yang menarik perhatian.",
      },
      {
        title: "Pahami",
        body: "Lihat perjalanan bisnis dan data perkembangannya.",
      },
      {
        title: "Gunakan AI",
        body: "Dapatkan ringkasan dari informasi yang tersedia.",
      },
      { title: "Hubungi", body: "Mulai percakapan dengan pemilik bisnis." },
    ],
  },

  ai: {
    visible: true,
    eyebrow: "LUMORA AI",
    heading: "AI yang membantu, bukan mengambil keputusan.",
    description:
      "AI di LUMORA menyusun draf dan merangkum informasi yang sudah ada. Pemilik bisnis tetap memeriksa dan mengedit setiap hasilnya, dan tidak ada penilaian kelayakan yang dibuat otomatis.",
    guardrailTitle: "Batas yang kami jaga",
    guardrailDescription:
      "LUMORA tidak memberikan rekomendasi investasi atau menentukan kelayakan sebuah usaha.",
  },

  finalCta: {
    visible: true,
    eyebrow: "Langkah berikutnya",
    heading: "Beri ruang untuk cerita usahamu.",
    description:
      "Buat profil UMKM untuk memperkenalkan produk, model bisnis, dan perjalanan usahamu. Atau kenali bisnis yang sudah bergabung.",
    primaryCta: {
      label: "Daftarkan UMKM",
      href: "/register?role=umkm",
    },
    secondaryCta: {
      label: "Jelajahi semua bisnis",
      href: "/explore",
    },
  },
};
