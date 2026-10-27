import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getMeApi, fetchBusinesses } from "@/lib/api";
import { readHomepageStore } from "@/lib/homepage-storage";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/homepage-defaults";
import { HeroSection } from "@/components/sections/hero-section";
import { ValueSection } from "@/components/sections/value-section";
import { BusinessDiscoverySection } from "@/components/sections/business-discovery-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { JourneySection } from "@/components/sections/journey-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { AiSection } from "@/components/sections/ai-section";
import { FinalCtaSection } from "@/components/sections/final-cta-section";

export const dynamic = "force-dynamic";

export default async function HomepageDraftPreviewPage() {
  const cookie = (await cookies()).toString();
  const user = await getMeApi(cookie);

  // Require admin session to preview draft
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const store = readHomepageStore();
  const content = store.draftContent || DEFAULT_HOMEPAGE_CONTENT;

  let businesses: Awaited<ReturnType<typeof fetchBusinesses>>["items"] = [];
  try {
    businesses = (await fetchBusinesses({ limit: 6 })).items;
  } catch {
    // Graceful fallback
  }

  return (
    <div className="relative min-h-screen bg-[#f5f2e9]">
      {/* Sticky Top Preview Banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-300 bg-amber-50/95 px-4 py-2.5 backdrop-blur-sm sm:px-6 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs text-amber-950">
          <span className="flex size-6 items-center justify-center rounded-md bg-amber-200 text-amber-900 font-bold">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <strong className="font-semibold">MODE PRATINJAU DRAFT BERANDA</strong>
            <span className="hidden sm:inline text-amber-800 ml-1.5">
              • Konten ini adalah draft aktif dan belum dipublikasikan ke publik.
            </span>
          </div>
        </div>

        <Link
          href="/admin?tab=1"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-100/60 shadow-2xs"
        >

          <ArrowLeft className="size-3.5" />
          <span>Kembali ke CMS</span>
        </Link>
      </div>

      {/* Render Public Landing Page with Draft Content */}
      <div className="lumora-home">
        {/* 1. Hero Section */}
        <HeroSection businesses={businesses} content={content.hero} />

        {/* 2. Value Proposition */}
        {content.value.visible && <ValueSection content={content.value} />}

        {/* 3. Jelajahi UMKM Discovery */}
        {content.discovery.visible && (
          <BusinessDiscoverySection
            businesses={businesses}
            content={content.discovery}
          />
        )}

        {/* 4. Fitur LUMORA */}
        {content.features.visible && <FeaturesSection content={content.features} />}

        {/* 5. Cerita & Perjalanan Bisnis */}
        {content.journey.visible && (
          <JourneySection business={businesses[0]} content={content.journey} />
        )}

        {/* 6. Cara Kerja */}
        {content.howItWorks.visible && (
          <HowItWorksSection content={content.howItWorks} />
        )}

        {/* 7. Lumora AI */}
        {content.ai.visible && <AiSection content={content.ai} />}

        {/* 8. Final CTA */}
        {content.finalCta.visible && (
          <FinalCtaSection content={content.finalCta} />
        )}
      </div>
    </div>
  );
}
