import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPage() {
  return (
    <PlaceholderPage
      title="Kebijakan privasi belum tersedia"
      description="Dokumen kebijakan privasi belum disusun."
      detail="Halaman ini ditautkan dari footer karena situs ini mengarahkan pengunjung untuk mendaftar. Sebelum pendaftaran benar-benar dibuka, dokumen ini harus diisi dengan kebijakan yang sebenarnya."
    />
  );
}
