import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  description: "Verifikasi alamat email akun LUMORA.",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const verificationToken = typeof token === "string" ? token.trim() : undefined;

  return (
    <section className="py-12 md:py-20">
      <Container>
        <VerifyEmailPanel token={verificationToken || undefined} />
      </Container>
    </section>
  );
}
