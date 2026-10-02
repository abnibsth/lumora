import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Buat Profil",
  description: "Buat akun dan mulai susun profil bisnis di LUMORA.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const { role } = await searchParams;
  const asUmkm = role !== "mitra";

  return (
    <section className="py-12 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl bg-surface p-6 shadow-panel sm:p-10 md:p-14">
          <p className="text-sm font-medium text-accent">
            {asUmkm ? "Untuk UMKM" : "Daftar Mitra"}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.25rem,10vw,3rem)] leading-[1.08] font-semibold text-ink md:text-5xl">
            Mulai dari informasi yang kamu punya.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">
            Setelah akun dibuat, LUMORA akan memandumu menyusun cerita, perjalanan, dan model bisnis langkah demi langkah.
          </p>
          <div className="mt-10">
            <RegisterForm asUmkm={asUmkm} />
          </div>
        </div>
      </Container>
    </section>
  );
}
