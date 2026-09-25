"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import {
  MobileNavPanel,
  MobileNavTrigger,
  useMobileMenu,
} from "@/components/layout/mobile-nav";
import { primaryNav } from "@/data/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { open, setOpen, triggerRef, panelRef } = useMobileMenu();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 bg-[#fffdf8] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          scrolled || open
            ? "border-b border-forest/10 bg-[#fffdf8]/92 shadow-[0_8px_24px_rgba(15,61,46,0.06)] backdrop-blur-md"
            : "border-b border-transparent shadow-none",
        )}
      >
        <Container>
          <div className="flex h-[4.5rem] items-center justify-between gap-6 xl:h-[4.75rem]">
            <Logo />

            <nav
              aria-label="Navigasi utama"
              className="absolute left-1/2 hidden -translate-x-1/2 items-center xl:flex"
            >
              {primaryNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-lg px-3.5 text-sm font-medium text-forest transition-colors duration-200 hover:bg-forest/[0.055] hover:text-forest-deep",
                      active && "bg-forest/[0.07] text-forest-deep",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 xl:flex">
              <Link
                href={ROUTES.login}
                className={cn(
                  buttonStyles({ variant: "ghost" }),
                  "text-forest hover:bg-forest/[0.055]",
                )}
              >
                Masuk
              </Link>
              <Link
                href={ROUTES.registerUmkm}
                className={cn(
                  buttonStyles({ variant: "primary" }),
                  "rounded-xl px-5 shadow-[0_4px_12px_rgba(15,61,46,0.14)] hover:shadow-[0_6px_16px_rgba(15,61,46,0.18)]",
                )}
              >
                Buat Profil
              </Link>
            </div>

            <MobileNavTrigger
              open={open}
              onToggle={() => setOpen(!open)}
              triggerRef={triggerRef}
            />
          </div>
        </Container>
      </header>

      <MobileNavPanel
        open={open}
        onClose={() => setOpen(false)}
        panelRef={panelRef}
        pathname={pathname}
      />
    </>
  );
}
