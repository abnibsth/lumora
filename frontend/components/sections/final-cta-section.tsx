import { Reveal } from "@/components/ui/section";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/lib/constants";
import type { HomepageContent } from "@/types/homepage";

export function FinalCtaSection({ content }: { content?: HomepageContent["finalCta"] }) {
  if (content && !content.visible) {
    return null;
  }

  const eyebrow = content?.eyebrow || "Langkah berikutnya";
  const heading = content?.heading || "Beri ruang untuk cerita usahamu.";
  const description =
    content?.description ||
    "Buat profil UMKM untuk memperkenalkan produk, model bisnis, dan perjalanan usahamu. Atau kenali bisnis yang sudah bergabung.";
  const primaryCta = content?.primaryCta || {
    label: "Daftarkan UMKM",
    href: ROUTES.registerUmkm,
  };
  const secondaryCta = content?.secondaryCta || {
    label: "Jelajahi semua bisnis",
    href: ROUTES.explore,
  };

  return (
    <section className="home-final" aria-labelledby="home-final-title">
      <Container>
        <div className="home-final-panel">
          <Reveal>
            <p className="home-eyebrow text-lime">{eyebrow}</p>
            <h2 id="home-final-title" className="home-heading mt-4">
              {heading}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="home-copy">{description}</p>
            <div className="home-final-actions">
              <Link id="home-final-register" href={primaryCta.href} className="home-button home-button-lime">
                {primaryCta.label} <span aria-hidden="true">↗</span>
              </Link>
              <Link id="home-final-explore" href={secondaryCta.href} className="home-link">
                {secondaryCta.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

