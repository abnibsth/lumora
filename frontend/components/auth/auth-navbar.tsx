"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

export function AuthNavbar({ pathname }: { pathname: string }) {
  const isLogin = pathname.startsWith("/login");

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-surface/95 backdrop-blur-md">
      <Container>
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          <Logo />

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="hidden text-muted sm:inline">
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
            </span>
            <Link
              href={isLogin ? ROUTES.register : ROUTES.login}
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
                className: "rounded-xl font-semibold gap-1.5",
              })}
            >
              <span>{isLogin ? "Daftar" : "Masuk"}</span>
              <ArrowRight className="size-3.5 text-forest" />
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

