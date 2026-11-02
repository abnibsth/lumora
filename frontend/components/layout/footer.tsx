import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { footerColumns, legalNav } from "@/data/navigation";
import { SITE } from "@/lib/constants";

/**
 * Editorial footer with balanced spacing for mobile and desktop viewports.
 * The layout groups columns cleanly, provides 44px tap targets for thumb-friendly navigation,
 * and maintains compact vertical rhythm on small devices.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="py-10 sm:py-14 md:py-20">
        <div className="grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3.5 max-w-xs text-sm text-muted leading-relaxed">
              {SITE.category}
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-ink">
                {column.title}
              </h2>
              <ul className="mt-3 sm:mt-4 flex flex-col gap-0.5 sm:gap-1">
                {footerColumns
                  ? column.items.map((item) => (
                      <li key={`${column.title}-${item.label}`}>
                        <Link
                          href={item.href}
                          className="flex min-h-11 w-full items-center text-sm text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-forest rounded-md"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))
                  : null}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm text-muted">© 2026 {SITE.name}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-xs sm:text-sm text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-forest rounded-md"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
