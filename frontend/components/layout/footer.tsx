import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { footerColumns, legalNav } from "@/data/navigation";
import { SITE } from "@/lib/constants";

/**
 * Light footer, on purpose. The page keeps one dark moment (the final call to
 * action) so that moment carries weight; a dark footer as well would split the
 * emphasis and cost the page its airy feel.
 *
 * The four columns are described in data/navigation.ts. Every link resolves to a
 * section on this page or to a real route, and there is no social row because no
 * LUMORA accounts exist to link to.
 *
 * The links carry `min-h-11` and fill their column, so each one is a 44px row
 * rather than a 20px line of text (R-03). The gap between rows drops to 4px to
 * offset that, which keeps the columns close to their original height. The full
 * row is the target, so a thumb cannot land between two links.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted">
              {SITE.category}
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-ink">
                {column.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-1">
                {column.items.map((item) => (
                  <li key={`${column.title}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="flex min-h-11 w-full items-center text-sm text-muted transition-colors hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">© 2026 {SITE.name}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink"
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
