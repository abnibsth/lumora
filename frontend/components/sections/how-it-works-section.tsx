import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/section";
import { Tabs } from "@/components/ui/tabs";
import { howItWorksSection, investorFlow, umkmFlow, type FlowStep } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";
import type { HomepageContent } from "@/types/homepage";

function StepProcess({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="home-flow">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span className="home-flow-number" aria-hidden="true">0{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorksSection({ content }: { content?: HomepageContent["howItWorks"] }) {
  if (content && !content.visible) {
    return null;
  }

  const eyebrow = content?.eyebrow || "Cara kerja";
  const heading = content?.heading || howItWorksSection.heading;
  const description = content?.description || howItWorksSection.description;
  const umkmLabel = content?.umkmLabel || "Pelaku UMKM";
  const partnerLabel = content?.partnerLabel || "Mitra & Pemodal";
  const umkmSteps = content?.umkmSteps?.length ? content.umkmSteps : umkmFlow;
  const partnerSteps = content?.partnerSteps?.length ? content.partnerSteps : investorFlow;

  return (
    <section id={SECTION_IDS.howItWorks} className="home-section home-how" aria-labelledby="home-how-title">
      <Container>
        <div className="home-how-layout">
          <Reveal>
            <p className="home-eyebrow">{eyebrow}</p>
            <h2 id="home-how-title" className="home-heading mt-4">{heading}</h2>
            <p className="home-copy mt-5">{description}</p>
          </Reveal>
          <Reveal delay={0.08}>
            {/* Segmented Control */}
            <Tabs
              label="Pilih alur penggunaan LUMORA"
              items={[
                { id: "home-flow-umkm", label: umkmLabel, content: <StepProcess steps={umkmSteps} /> },
                { id: "home-flow-partner", label: partnerLabel, content: <StepProcess steps={partnerSteps} /> },
              ]}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

