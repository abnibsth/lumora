import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getMeApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Buat Akun",
  description: "Daftar akun sebagai Pemilik UMKM atau Mitra Bisnis di platform LUMORA.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const { role } = await searchParams;
  const cookie = (await cookies()).toString();
  const user = await getMeApi(cookie);

  if (user) {
    redirect(ROUTES.dashboard);
  }

  const initialRole = role === "mitra" ? "mitra" : "umkm";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-ivory flex items-center justify-center py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[720px] lg:max-w-[760px] overflow-hidden rounded-3xl sm:rounded-[2rem] border border-line bg-surface p-6 sm:p-10 lg:p-12 shadow-[0_24px_70px_-20px_rgba(15,61,46,0.08)]">
        <Suspense
          fallback={
            <div className="h-96 flex items-center justify-center text-sm text-muted">
              Memuat formulir pendaftaran...
            </div>
          }
        >
          <RegisterForm initialRole={initialRole} />
        </Suspense>
      </div>
    </div>
  );
}
