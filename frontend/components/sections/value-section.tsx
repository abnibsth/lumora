import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/section";
import { SECTION_IDS } from "@/lib/constants";
import type { HomepageContent } from "@/types/homepage";

export function ValueSection({ content }: { content?: HomepageContent["value"] }) {
  if (content && !content.visible) {
    return null;
  }

  const eyebrow = content?.eyebrow || "Untuk usaha lokal Indonesia";
  const headingLead = content?.headingLead || "Usahamu punya cerita.";
  const headingEmphasis = content?.headingEmphasis || "Beri ruang untuk dikenal.";
  const description =
    content?.description ||
    "LUMORA membantu pemilik UMKM menyusun profil dan perjalanan usahanya agar calon mitra dapat mempelajari bisnis dari informasi yang dibagikan pemiliknya.";
  const points = content?.points?.length
    ? content.points
    : [
        {
          title: "Lebih mudah diperkenalkan",
          body: "Cerita, produk, dan kebutuhan usahamu tersusun dalam satu profil digital yang dapat dibagikan.",
        },
        {
          title: "Lebih mudah dipahami",
          body: "Business Model Canvas membantu menjelaskan bagaimana usaha berjalan, dari pelanggan hingga struktur biaya.",
        },
        {
          title: "Lebih mudah ditemukan",
          body: "Calon mitra dapat menelusuri profil dan mengenal perjalanan usaha sebelum memulai percakapan.",
        },
      ];

  return (
    <section id={SECTION_IDS.value} className="home-section">
      <Container>
        <Reveal distance={16}>
          <div id={SECTION_IDS.about} className="home-value-intro">
            <div>
              <p className="home-eyebrow">{eyebrow}</p>
              <h2 className="home-heading mt-4">
                {headingLead}
                <br /> <em>{headingEmphasis}</em>
              </h2>
            </div>
            <p className="home-copy">{description}</p>
          </div>
        </Reveal>

        <div className="home-value-points">
          {points.map((item, index) => (
            <Reveal key={item.title} distance={12} delay={index * 0.04} className="home-value-point">
              <span className="home-value-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

