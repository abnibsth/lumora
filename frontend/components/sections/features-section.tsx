import Link from "next/link";
import { Reveal } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { ROUTES, SECTION_IDS } from "@/lib/constants";
import type { HomepageContent } from "@/types/homepage";

const features = [
  {
    title: "Profil bisnis digital",
    description:
      "Satukan cerita pemilik, produk, lokasi, dan kebutuhan kemitraan dalam satu profil yang dapat dibaca calon mitra.",
  },
  {
    title: "Business Model Canvas",
    description:
      "Susun sembilan bagian model bisnis dengan panduan dan bantuan draf AI. Periksa dan edit hasilnya sesuai kondisi usahamu.",
  },
  {
    title: "Jelajah usaha lokal",
    description:
      "Telusuri profil UMKM, pilih kategori usaha, lalu pelajari bisnis yang ingin kamu kenal lebih jauh.",
  },
  {
    title: "Catatan perjalanan usaha",
    description:
      "Simpan tonggak perkembangan bisnis beserta tahunnya, sehingga calon mitra dapat mengikuti proses di balik usaha tersebut.",
  },
];

export function FeaturesSection({ content }: { content?: HomepageContent["features"] }) {
  if (content && !content.visible) {
    return null;
  }

  const eyebrow = content?.eyebrow || "Fitur LUMORA";
  const headingLead = content?.headingLead || "Satu tempat untuk";
  const headingEmphasis = content?.headingEmphasis || "usahamu.";
  const description =
    content?.description ||
    "Kenalkan bisnis dengan informasi yang lebih lengkap. Mulai dari profil dan model bisnis, hingga perjalanan yang ingin kamu bagikan.";
  const primaryCta = content?.primaryCta || {
    label: "Buat profil usahamu",
    href: ROUTES.registerUmkm,
  };
  const secondaryLink = content?.secondaryLink || {
    label: "Coba asisten LUMORA AI",
    href: `#${SECTION_IDS.ai}`,
  };
  const items = content?.items?.length ? content.items : features;

  return (
    <section id="fitur-lumora" aria-labelledby="home-features-title" className="home-section home-features">
      <Container>
        <div className="home-features-layout">
          <Reveal distance={16}>
            <p className="home-eyebrow">{eyebrow}</p>
            <h2 id="home-features-title" className="home-heading mt-4">
              {headingLead}
              <br className="hidden lg:block" /> merapikan cerita <em>{headingEmphasis}</em>
            </h2>
            <p className="home-copy mt-6 max-w-md">{description}</p>
            <Link id="home-features-create-profile" href={primaryCta.href} className="home-button home-button-lime mt-8">
              {primaryCta.label}
            </Link>
          </Reveal>

          <div>
            <dl className="home-feature-list">
              {items.map((item, index) => (
                <Reveal key={item.title} distance={12} delay={index * 0.04} className="home-feature">
                  <dt>
                    <span className="home-feature-number" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <span className="home-feature-title">{item.title}</span>
                  </dt>
                  <dd className="home-feature-description">{item.description}</dd>
                </Reveal>
              ))}
            </dl>
            <Link id="home-features-ai-link" href={secondaryLink.href} className="home-link mt-6">
              {secondaryLink.label} <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}


