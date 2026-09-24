import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="Halaman masuk belum dibuka"
      description="Halaman ini akan menjadi tempat pengguna masuk ke akun LUMORA."
      detail="Belum ada sistem akun, jadi tidak ada formulir masuk di sini. Kami tidak menampilkan formulir contoh yang tidak berfungsi."
    />
  );
}
