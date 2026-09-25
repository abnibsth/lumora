import type { Metadata } from "next";
import { BusinessDiscoveryExplorer } from "@/components/business/business-discovery-explorer";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Jelajahi Bisnis",
  description: "Jelajahi profil, cerita, perkembangan, dan kebutuhan UMKM dari berbagai daerah di Indonesia.",
};

export default function ExplorePage() {
  return (
    <>
      <section className="bg-forest py-16 text-white md:py-24">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Jelajahi Bisnis"
            title="Temukan bisnis lokal yang menarik untuk dikenal."
            description="Jelajahi cerita, perkembangan, dan kebutuhan UMKM dari berbagai daerah di Indonesia."
            className="max-w-4xl"
            titleClassName="font-display text-white"
          />
        </Container>
      </section>

      <section className="py-12 md:py-20" aria-labelledby="discovery-heading">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="discovery-heading" className="font-display text-3xl font-semibold text-ink sm:text-4xl">Profil bisnis</h2>
              <p className="mt-2 max-w-xl text-muted">Cari berdasarkan nama, jenis usaha, atau kota.</p>
            </div>
            <Badge tone="demo">Seluruh profil dan data adalah contoh</Badge>
          </div>
          <BusinessDiscoveryExplorer full />
        </Container>
      </section>
    </>
  );
}
