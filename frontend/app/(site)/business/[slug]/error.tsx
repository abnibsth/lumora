"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/lib/constants";

export default function BusinessError({ reset }: { reset: () => void }) {
  return (
    <Container className="py-20">
      <div className="border-y border-line py-12">
        <h1 className="font-display text-3xl font-semibold text-ink">Profil bisnis gagal dimuat.</h1>
        <p className="mt-3 text-muted">Backend sedang tidak dapat memberikan detail profil ini.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className={buttonStyles({ variant: "primary" })}>Coba lagi</button>
          <Link href={ROUTES.explore} className={buttonStyles({ variant: "secondary" })}>Kembali ke jelajah</Link>
        </div>
      </div>
    </Container>
  );
}
