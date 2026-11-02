import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { getMeApi } from "@/lib/api";
import { getRedirectTarget } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Masuk ke Akun",
  description: "Masuk ke akun LUMORA untuk mengelola profil bisnis UMKM atau mengakses kemitraan.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const redirectTo = getRedirectTarget((await searchParams).next);
  const user = await getMeApi((await cookies()).toString());

  if (user) {
    redirect(redirectTo);
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-ivory flex items-center justify-center py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1240px] xl:max-w-[1280px] overflow-hidden rounded-3xl sm:rounded-[2rem] border border-line bg-surface shadow-[0_24px_70px_-20px_rgba(15,61,46,0.08)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[660px] lg:min-h-[720px] xl:min-h-[760px]">
          {/* Left: Brand & Editorial Panel (42% width on desktop) */}
          <div className="lg:col-span-5 hidden lg:block">
            <AuthBrandPanel />
          </div>

          {/* Right: Login Form (58% width on desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-14 lg:px-14 xl:px-18">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </div>
  );
}
