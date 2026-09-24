import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Daftar" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const { role } = await searchParams;
  const asUmkm = role === "umkm";

  return (
    <PlaceholderPage
      title="Pendaftaran belum dibuka"
      description={
        asUmkm
          ? "Halaman ini akan menjadi tempat pelaku UMKM membuat akun dan mulai menyusun profil bisnis."
          : "Halaman ini akan menjadi tempat pendaftaran akun LUMORA."
      }
      detail="Formulir pendaftaran belum dibuat, jadi tidak ada data yang bisa diisi di sini. Kami tidak menampilkan formulir contoh yang tidak berfungsi."
    />
  );
}
