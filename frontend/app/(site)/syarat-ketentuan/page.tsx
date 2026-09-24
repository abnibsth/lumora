import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Syarat dan Ketentuan" };

export default function TermsPage() {
  return (
    <PlaceholderPage
      title="Syarat dan ketentuan belum tersedia"
      description="Dokumen syarat dan ketentuan belum disusun."
      detail="Halaman ini ditautkan dari footer karena situs ini mengarahkan pengunjung untuk mendaftar. Sebelum pendaftaran benar-benar dibuka, dokumen ini harus diisi dengan ketentuan yang sebenarnya."
    />
  );
}
