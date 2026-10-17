import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchBusinessBySlug } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { BusinessProfileView } from "@/components/business/business-profile-view";
import { BusinessBookmarkAction } from "@/components/business/business-bookmark-action";
import { ROUTES } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusinessBySlug(slug);
  return {
    title: business
      ? `${business.name} · Profil Bisnis | LUMORA`
      : "Profil Bisnis | LUMORA",
    description:
      business?.description ||
      "Profil digital, perjalanan usaha, dan model bisnis UMKM di LUMORA.",
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await fetchBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <main className="min-h-screen bg-ivory">
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-line/60 bg-surface/50">
        <Container className="py-3">
          <Link
            href={ROUTES.explore}
            className="inline-flex min-h-10 items-center gap-2 text-xs sm:text-sm font-semibold text-forest hover:text-accent transition-colors"
          >
            <span aria-hidden="true">&larr;</span> Kembali ke Jelajahi Bisnis
          </Link>
        </Container>
      </div>

      {/* Main Profile Presentation */}
      <BusinessProfileView
        business={business}
        isModal={false}
        actionSlot={<BusinessBookmarkAction slug={business.slug} />}
      />
    </main>
  );
}

