import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/lib/constants";

export function AuthFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-line/60 bg-surface py-6 text-xs text-muted">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {currentYear} LUMORA. Platform Pitching Digital UMKM Indonesia.</p>
          <div className="flex items-center gap-6">
            <Link
              href={ROUTES.privacy}
              className="min-h-11 inline-flex items-center text-muted transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
            >
              Kebijakan Privasi
            </Link>
            <span className="text-line" aria-hidden="true">
              ·
            </span>
            <Link
              href={ROUTES.terms}
              className="min-h-11 inline-flex items-center text-muted transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-forest"
            >
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

