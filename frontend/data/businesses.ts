import type { Business } from "@/types/business";

/**
 * Demo data for the discovery preview, as PRD 15 permits.
 *
 * These are not real businesses and the discovery section must say so on screen.
 * The section carries a visible "Contoh profil" label, which is what keeps this
 * inside R-38: a labelled placeholder, never content passed off as real.
 *
 * The revenue and growth values are the same kind of demo metric the PRD shows
 * in its own example. They stay only as long as that label is visible; without
 * it they would be unsourced statistics and a Hard Gate failure under R-17.
 *
 * "Kopi Ruang Senja" is the PRD's own example, kept as-is so the design and the
 * spec can be compared directly.
 */
export const businesses: Business[] = [
  {
    id: "kopi-ruang-senja",
    slug: "kopi-ruang-senja",
    name: "Kopi Ruang Senja",
    category: "F&B",
    location: "Bandung",
    description: "Kedai kopi independen dengan konsep ruang komunitas.",
    foundedYear: 2023,
    revenueLabel: "Rp18,4 jt/bln",
    growthLabel: "+23% / 6 bulan",
    revenueSeries: [12.1, 13.4, 14.2, 15.8, 16.9, 18.4],
    seeking: ["Mitra Ekspansi"],
    seekingObjective: "Membuka cabang kedua di Bandung.",
    // The four stops come from PRD 10.9. Titles only: the PRD gives no detail
    // behind each one, and writing that detail here would be inventing history
    // for a business that does not exist.
    milestones: [
      { year: 2023, title: "Kopi Ruang Senja dibuka" },
      { year: 2024, title: "Mencapai 100 pelanggan pertama" },
      { year: 2025, title: "Menambah menu dan kapasitas" },
      { year: 2026, title: "Mencari mitra untuk ekspansi" },
    ],
    // Nine canvas blocks derived from the description above, so the showcase can
    // show the feature without the canvas contradicting the rest of the profile.
    bmc: [
      { label: "Mitra Utama", value: "Pemasok biji kopi lokal" },
      { label: "Aktivitas Utama", value: "Operasional kedai dan acara komunitas" },
      { label: "Sumber Daya Utama", value: "Tempat, barista, pelanggan tetap" },
      { label: "Proposisi Nilai", value: "Ruang komunitas dengan kopi rumahan" },
      { label: "Hubungan Pelanggan", value: "Pelanggan tetap dan acara rutin" },
      { label: "Saluran", value: "Kedai langsung dan pesanan daring" },
      { label: "Segmen Pelanggan", value: "Warga sekitar dan pekerja jarak jauh" },
      { label: "Struktur Biaya", value: "Sewa, bahan baku, dan gaji barista" },
      { label: "Sumber Pendapatan", value: "Penjualan minuman dan makanan ringan" },
    ],
  },
  {
    id: "dapur-bu-yanti",
    slug: "dapur-bu-yanti",
    name: "Dapur Bu Yanti",
    category: "F&B",
    location: "Yogyakarta",
    description: "Katering rumahan untuk acara keluarga dan kantor.",
    foundedYear: 2019,
    revenueLabel: "Rp12,1 jt/bln",
    growthLabel: "+11% / 6 bulan",
    seeking: ["Mitra Distribusi"],
  },
  {
    id: "batik-sekar-ayu",
    slug: "batik-sekar-ayu",
    name: "Batik Sekar Ayu",
    category: "Fashion",
    location: "Surakarta",
    description: "Batik tulis dengan perajin lokal, dijual daring dan luring.",
    foundedYear: 2017,
    revenueLabel: "Rp27,6 jt/bln",
    growthLabel: "+18% / 6 bulan",
    seeking: ["Mitra Ekspansi", "Mitra Distribusi"],
  },
  {
    id: "bengkel-sahabat-motor",
    slug: "bengkel-sahabat-motor",
    name: "Bengkel Sahabat Motor",
    category: "Jasa",
    location: "Bekasi",
    description: "Servis dan perawatan motor harian untuk warga sekitar.",
    foundedYear: 2021,
    revenueLabel: "Rp9,3 jt/bln",
    growthLabel: "+7% / 6 bulan",
    seeking: ["Penambahan Alat"],
  },
  {
    id: "toko-berkah-jaya",
    slug: "toko-berkah-jaya",
    name: "Toko Berkah Jaya",
    category: "Retail",
    location: "Surabaya",
    description: "Kebutuhan harian dengan layanan antar untuk lingkungan sekitar.",
    foundedYear: 2015,
    revenueLabel: "Rp31,8 jt/bln",
    growthLabel: "+9% / 6 bulan",
    seeking: ["Mitra Distribusi"],
  },
  {
    id: "sanggar-keramik-lempung",
    slug: "sanggar-keramik-lempung",
    name: "Sanggar Keramik Lempung",
    category: "Kreatif",
    location: "Bandung",
    description: "Studio keramik dengan kelas pemula dan penjualan hasil karya.",
    foundedYear: 2020,
    revenueLabel: "Rp7,4 jt/bln",
    growthLabel: "+31% / 6 bulan",
    seeking: ["Mitra Ekspansi"],
  },
];
