"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") || "").trim();
    const password = String(fields.get("password") || "");
    const nextErrors = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "Masukkan alamat email yang valid.",
      password: password ? undefined : "Masukkan kata sandi untuk mencoba validasi form.",
    };
    setErrors(nextErrors);
    setNotice("");
    if (nextErrors.email || nextErrors.password) {
      event.currentTarget.querySelector<HTMLInputElement>(nextErrors.email ? "#admin-email" : "#admin-password")?.focus();
      return;
    }
    // Prototype checks fields locally; credentials are never sent or persisted.
    event.currentTarget.reset();
    setVisible(false);
    setNotice("Login belum tersedia karena autentikasi backend belum terhubung. Tidak ada kredensial yang dikirim atau disimpan.");
  }

  return (
    <main className="grid min-h-svh w-full grid-cols-1 bg-[#FAF9F5] md:grid-cols-[42%_58%] xl:grid-cols-[48%_52%]">
      <aside aria-label="LUMORA Admin Workspace" className="flex min-w-0 flex-col bg-[#103D30] px-6 py-7 text-[#FAF9F5] md:min-h-svh md:px-8 md:py-10 lg:px-12 xl:px-16 xl:py-12">
        <div><Logo tone="light" /></div>
        <div className="my-8 max-w-lg md:my-auto md:py-16">
          <p className="mb-5 hidden text-xs font-medium uppercase tracking-[0.2em] text-[#b7df68] md:block">Admin Workspace</p>
          <h2 className="text-3xl font-medium leading-[1.12] tracking-[-0.04em] md:text-[clamp(2.4rem,4vw,4.5rem)]">Kelola bisnis dengan lebih baik.</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#FAF9F5]/75 md:mt-7 md:text-base md:leading-8">Satu ruang untuk mengelola UMKM, cerita usaha, dan peluang bisnis.</p>
          <div aria-hidden="true" className="mt-10 hidden h-px w-14 bg-[#b7df68] md:block" />
        </div>
        <p className="hidden text-xs tracking-wide text-[#FAF9F5]/60 md:block">LUMORA — Admin Workspace</p>
      </aside>

      <section aria-labelledby="admin-login-heading" className="flex min-w-0 flex-col px-6 py-8 sm:px-10 md:min-h-svh md:px-8 md:py-10 lg:px-12 xl:px-16 xl:py-12">
        <Link id="admin-back-website" href="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-xs font-medium text-[#66736d] transition-colors hover:text-[#103D30]">
          <ArrowLeft aria-hidden="true" className="size-4" /> Kembali ke website
        </Link>
        <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }} className="mx-auto my-auto w-full max-w-[440px] py-10 md:py-12">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#66736d]">LUMORA CMS</p>
          <h1 id="admin-login-heading" className="mt-4 text-[clamp(1.9rem,2.5vw,2.5rem)] font-semibold leading-[1.2] tracking-[-0.04em] text-[#103D30]">Selamat datang kembali.</h1>
          <p className="mt-3 text-sm leading-7 text-[#66736d]">Masuk ke dashboard administrator.</p>

          <form id="admin-login-form" noValidate onSubmit={handleSubmit} className="mt-9 space-y-6" aria-describedby="admin-prototype-note">
            <div className="space-y-2.5">
              <Label htmlFor="admin-email" className="text-sm font-medium text-[#14382f]">Email</Label>
              <Input id="admin-email" name="email" type="email" autoComplete="off" placeholder="nama@perusahaan.com" required aria-invalid={!!errors.email} aria-describedby={errors.email ? "admin-email-error" : undefined} className="h-12 rounded-lg border-[#d8d8cf] bg-transparent px-4 text-base shadow-none focus-visible:border-[#103D30] focus-visible:ring-[#103D30]/15" />
              {errors.email && <p id="admin-email-error" className="text-xs text-[#a1342b]">{errors.email}</p>}
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="admin-password" className="text-sm font-medium text-[#14382f]">Kata sandi</Label>
              <div className="relative">
                <Input id="admin-password" name="password" type={visible ? "text" : "password"} autoComplete="off" placeholder="Masukkan kata sandi" required aria-invalid={!!errors.password} aria-describedby={errors.password ? "admin-password-error" : undefined} className="h-12 rounded-lg border-[#d8d8cf] bg-transparent pl-4 pr-14 text-base shadow-none focus-visible:border-[#103D30] focus-visible:ring-[#103D30]/15" />
                <button id="admin-password-toggle" type="button" aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={visible} aria-controls="admin-password" onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-[#66736d] hover:text-[#103D30]">
                  {visible ? <EyeOff aria-hidden="true" className="size-[18px]" /> : <Eye aria-hidden="true" className="size-[18px]" />}
                </button>
              </div>
              {errors.password && <p id="admin-password-error" className="text-xs text-[#a1342b]">{errors.password}</p>}
            </div>
            <Button id="admin-login-submit" type="submit" className="h-12 w-full rounded-lg bg-[#103D30] text-sm font-medium text-white transition-colors duration-300 hover:bg-[#0b3027]">Masuk ke dashboard <ArrowRight aria-hidden="true" className="ml-2 size-4" /></Button>
            {notice && <p role="status" className="rounded-lg border border-[#d8d8cf] bg-[#e7efe9]/50 p-3 text-xs leading-6 text-[#14382f]">{notice}</p>}
          </form>

          <p id="admin-prototype-note" className="mt-5 text-xs leading-6 text-[#66736d]">Prototype UI · Login belum aktif. Gunakan data contoh saja; jangan masukkan kredensial asli. Form hanya memeriksa input di perangkat ini.</p>
          <div className="mt-8 border-t border-[#d8d8cf] pt-6">
            <Link id="admin-open-prototype" href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#103D30] underline decoration-[#103D30]/25 underline-offset-4 hover:decoration-[#103D30]">Lihat demo dashboard <ArrowUpRightIcon /></Link>
            <p className="text-xs leading-6 text-[#66736d]">Pratinjau data demo, bukan login. Dashboard belum diproteksi.</p>
          </div>
        </motion.div>
        <p className="text-center text-[11px] text-[#66736d]">LUMORA — Admin Workspace</p>
      </section>
    </main>
  );
}

function ArrowUpRightIcon() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-3.5"><path d="M4 12 12 4M4 4h8v8" /></svg>;
}


