"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { AuthNavbar } from "@/components/auth/auth-navbar";

export function SiteHeader() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/");

  if (isAuthPage) {
    return <AuthNavbar key="auth-header" pathname={pathname} />;
  }

  return <Navbar key="main-header" />;
}

