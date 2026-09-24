"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

/**
 * Sticky header, transparent over the hero and solid once the page scrolls, as
 * PRD 10.1 asks.
 *
 * The blurred surface is the one glass element on the site (R-10 caps glass at
 * one or two). Reason: the bar has to stay legible over the hero while still
 * reading as an overlay rather than an opaque band cutting the page in half.
 * Everything else on the page is solid.
 *
 * Note the panel is rendered after </header>, not inside it, because the
 * header's backdrop-filter would otherwise become the containing block for the
 * panel's fixed positioning.
 *
 * The desktop links use `min-h-11` rather than vertical padding, so their hit box
 * clears 44px for touch laptops and landscape tablets where this row is visible.
 * The header row is 80px tall at this breakpoint, so nothing grows.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { open, setOpen, triggerRef, panelRef } = useMobileMenu();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-300",
          solid
            ? "border-line bg-surface/85 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-2 lg:h-20">
            <Logo />

            <nav
              aria-label="Navigasi utama"
              className="hidden lg:flex lg:items-center lg:gap-1"
            >
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.login}
                className={cn(
                  buttonStyles({ variant: "ghost" }),
                  "hidden lg:inline-flex",
                )}
              >
                Masuk
              </Link>
              <Link
                href={ROUTES.register}
                className={buttonStyles({
                  variant: "accent",
                  className: "px-4 lg:px-5",
                })}
              >
                Daftar
              </Link>
              <MobileNavTrigger
                open={open}
                onToggle={() => setOpen(!open)}
                triggerRef={triggerRef}
              />
            </div>
          </div>
        </Container>
      </header>

      <MobileNavPanel
        open={open}
        onClose={() => setOpen(false)}
        panelRef={panelRef}
      />
    </>
  );
}
