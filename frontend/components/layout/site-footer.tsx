"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { AuthFooter } from "@/components/auth/auth-footer";

export function SiteFooter() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/");

  if (isAuthPage) {
    return <AuthFooter key="auth-footer" />;
  }

  return <Footer key="main-footer" />;
}

