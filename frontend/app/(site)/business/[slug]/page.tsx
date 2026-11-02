import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
      {/* Top Editorial Breadcrumb Navigation */}
      <div className="border-b border-line/60 bg-surface/60 backdrop-blur-xs">
        <Container className="py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
            <Link
              href={ROUTES.explore}
              className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted hover:text-forest transition-colors rounded-lg focus-visible:outline-2 focus-visible:outline-forest"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Jelajahi Bisnis</span>
            </Link>
            <span className="text-muted/40 select-none" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-forest truncate max-w-[180px] sm:max-w-md">
              {business.name}
            </span>
          </nav>
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
