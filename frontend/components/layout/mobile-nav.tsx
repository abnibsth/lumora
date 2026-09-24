"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { primaryNav } from "@/data/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation is a disclosure, not a modal: the trigger carries
 * `aria-expanded` and points at the panel with `aria-controls`, so no focus trap
 * is needed, and Escape closes it and returns focus to the trigger.
 *
 * The trigger and the panel are two separate components on purpose. The header
 * uses `backdrop-blur`, and an element with `backdrop-filter` becomes the
 * containing block for any `position: fixed` descendant. A panel rendered inside
 * the header would therefore be positioned against the header box instead of the
 * viewport, and the page content would paint over it. Rendering the panel as a
 * sibling of the header keeps its fixed positioning honest.
 */
export function useMobileMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Stop the page behind the panel from scrolling while it is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel so keyboard users land inside it.
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return { open, setOpen, triggerRef, panelRef };
}

export function MobileNavTrigger({
  open,
  onToggle,
  triggerRef,
}: {
  open: boolean;
  onToggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-controls="mobile-menu"
      onClick={onToggle}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink transition-colors hover:bg-background lg:hidden"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
      </svg>
      {open ? "Tutup" : "Menu"}
    </button>
  );
}

export function MobileNavPanel({
  open,
  onClose,
  panelRef,
}: {
  open: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={panelRef}
      id="mobile-menu"
      hidden={!open}
      className={cn(
        "fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-surface lg:hidden",
      )}
    >
      {/* Labelled differently from the desktop nav so screen reader users
          listing landmarks can tell the two apart. */}
      <nav aria-label="Navigasi utama seluler" className="px-4 py-4">
        <ul className="flex flex-col">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-ink transition-colors hover:bg-background"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          <Link
            href={ROUTES.login}
            onClick={onClose}
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            Masuk
          </Link>
          <Link
            href={ROUTES.register}
            onClick={onClose}
            className={buttonStyles({ variant: "accent", size: "lg" })}
          >
            Daftar
          </Link>
        </div>
      </nav>
    </div>
  );
}
