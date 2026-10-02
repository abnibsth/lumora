import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Masuk", description: "Masuk ke akun LUMORA." };

export default function LoginPage() {
  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl bg-surface shadow-panel lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-forest p-6 text-white sm:p-8 md:p-12">
            <p className="text-sm font-medium text-green">Selamat datang kembali</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,10vw,3rem)] leading-[1.08] font-semibold md:text-5xl">
              Lanjutkan cerita bisnismu.
            </h1>
            <p className="mt-5 leading-7 text-mint">
              Masuk untuk mengelola profil, memperbarui perjalanan bisnis, dan melihat profil yang kamu simpan.
            </p>
          </div>
          <div className="p-6 sm:p-8 md:p-12">
            <LoginForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
