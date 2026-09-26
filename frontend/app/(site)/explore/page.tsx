import type { Metadata } from "next";
import { BusinessDiscoveryExplorer } from "@/components/business/business-discovery-explorer";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Jelajahi Bisnis",
  description: "Jelajahi profil, cerita, perkembangan, dan kebutuhan UMKM dari berbagai daerah di Indonesia.",
};

export default function ExplorePage() {
  return (
    <section className="pb-24 pt-12 md:pb-32 md:pt-20" aria-labelledby="explore-title">
      <Container>
        <div className="max-w-4xl border-b border-line pb-10">
          <p className="text-sm font-medium text-accent">Jelajahi Bisnis</p>
          <h1 id="explore-title" className="mt-4 max-w-3xl text-balance font-display text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">
            Temukan bisnis lokal yang layak dikenal.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Jelajahi cerita, perkembangan, dan kebutuhan UMKM dari berbagai daerah di Indonesia.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-2xl font-semibold text-ink">Bisnis untuk kamu kenali</p>
          <Badge tone="demo">Profil dan data contoh</Badge>
        </div>
        <div className="mt-7">
          <BusinessDiscoveryExplorer full />
        </div>
      </Container>
    </section>
  );
}
