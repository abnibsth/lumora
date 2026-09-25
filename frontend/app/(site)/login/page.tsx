import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Masuk", description: "Masuk ke akun LUMORA." };

export default function LoginPage() {
  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl bg-surface shadow-panel lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-forest p-8 text-white md:p-12">
            <p className="text-sm font-medium text-green">Selamat datang kembali</p>
            <h1 className="mt-4 font-display text-4xl font-semibold md:text-5xl">Lanjutkan cerita bisnismu.</h1>
            <p className="mt-5 leading-7 text-mint">Masuk untuk mengelola profil, memperbarui perjalanan bisnis, dan melihat profil yang kamu simpan.</p>
          </div>
          <div className="p-8 md:p-12">
            <h2 className="font-display text-3xl font-semibold text-ink">Masuk ke LUMORA</h2>
            <p className="mt-2 text-sm text-muted">Antarmuka ini siap diuji. Autentikasi backend belum diaktifkan.</p>
            <form className="mt-8 space-y-5">
              <div><label htmlFor="email" className="text-sm font-medium text-ink">Email</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-[#fffdf8] px-4 text-ink placeholder:text-muted" /></div>
              <div><div className="flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium text-ink">Kata sandi</label><button type="button" className="min-h-11 text-sm font-medium text-accent">Lupa kata sandi?</button></div><input id="password" name="password" type="password" autoComplete="current-password" required className="min-h-12 w-full rounded-xl border border-line-strong bg-[#fffdf8] px-4 text-ink" /></div>
              <button type="submit" className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}>Masuk</button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">Belum punya akun? <Link href={ROUTES.registerUmkm} className="font-semibold text-accent hover:text-forest">Buat profil bisnis</Link></p>
          </div>
        </div>
      </Container>
    </section>
  );
}
