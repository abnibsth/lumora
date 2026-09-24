import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20 md:py-28">
          <div className="flex max-w-2xl flex-col items-start gap-5">
            <p className="text-sm font-medium text-accent">404</p>
            <h1 className="text-section font-semibold text-ink">
              Halaman ini tidak ada.
            </h1>
            <p className="text-lead text-muted">
              Alamat yang kamu buka tidak ditemukan. Mungkin tautannya salah
              ketik, atau halamannya sudah dipindahkan.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTES.home}
                className={buttonStyles({ variant: "accent" })}
              >
                Kembali ke beranda
              </Link>
              <Link
                href={`#${SECTION_IDS.businesses}`}
                className={buttonStyles({ variant: "secondary" })}
              >
                Lihat contoh bisnis
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
