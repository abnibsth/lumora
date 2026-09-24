import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Jelajahi UMKM" };

export default function ExplorePage() {
  return (
    <PlaceholderPage
      title="Discovery hub belum dibuka"
      description="Halaman ini akan menjadi tempat menelusuri UMKM berdasarkan kategori, lokasi, dan indikator perkembangan usaha."
      detail="Untuk sekarang, contoh profil bisnis dapat dilihat pada bagian Jelajahi UMKM di halaman utama. Data yang tampil di sana adalah contoh, bukan data bisnis nyata."
    />
  );
}
