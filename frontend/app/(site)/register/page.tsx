import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Buat Profil", description: "Buat akun dan mulai susun profil bisnis di LUMORA." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) {
  const { role } = await searchParams;
  const asUmkm = role === "umkm";

  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl bg-surface p-7 shadow-panel sm:p-10 md:p-14">
          <p className="text-sm font-medium text-accent">{asUmkm ? "Untuk UMKM" : "Daftar LUMORA"}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">Mulai dari informasi yang kamu punya.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">Setelah akun dibuat, LUMORA akan memandumu menyusun cerita, perjalanan, dan model bisnis langkah demi langkah.</p>
          <form className="mt-10 grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="name" className="text-sm font-medium text-ink">Nama lengkap</label><input id="name" name="name" autoComplete="name" required className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-[#fffdf8] px-4" /></div>
            <div><label htmlFor="business-name" className="text-sm font-medium text-ink">Nama bisnis</label><input id="business-name" name="businessName" required className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-[#fffdf8] px-4" /></div>
            <div className="sm:col-span-2"><label htmlFor="register-email" className="text-sm font-medium text-ink">Email</label><input id="register-email" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-[#fffdf8] px-4 placeholder:text-muted" /></div>
            <div className="sm:col-span-2"><label htmlFor="register-password" className="text-sm font-medium text-ink">Kata sandi</label><input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-[#fffdf8] px-4" /><p className="mt-2 text-xs text-muted">Minimal 8 karakter.</p></div>
            <div className="sm:col-span-2"><button type="submit" className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}>Buat akun dan lanjutkan</button><p className="mt-3 text-center text-xs text-muted">Formulir dapat diuji, tetapi penyimpanan akun belum tersambung ke backend.</p></div>
          </form>
          <p className="mt-7 text-center text-sm text-muted">Sudah punya akun? <Link href={ROUTES.login} className="font-semibold text-accent hover:text-forest">Masuk</Link></p>
        </div>
      </Container>
    </section>
  );
}
