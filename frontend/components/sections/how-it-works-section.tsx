import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Tabs } from "@/components/ui/tabs";
import { JourneyList, JourneyStep } from "@/components/ui/journey-line";
import {
  howItWorksSection,
  investorFlow,
  umkmFlow,
  type FlowStep,
} from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

/**
 * How it works, as two flows behind one segmented control.
 *
 * Both flows are sequences, so both use the journey line. That is the motif
 * doing its actual job: showing that these are steps in an order, which is why
 * it was built rather than a decorative grid.
 *
 * The flows are rendered by the same component so the two sides cannot drift
 * apart in structure, and the step markers are numbered rather than bulleted
 * because the order carries meaning.
 */
function Flow({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <JourneyList>
        {steps.map((step, index) => (
          <JourneyStep
            key={step.title}
            marker={String(index + 1).padStart(2, "0")}
            title={step.title}
          >
            {step.body}
          </JourneyStep>
        ))}
      </JourneyList>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <Section id={SECTION_IDS.howItWorks}>
      <SectionHeading
        align="center"
        title={howItWorksSection.heading}
        description={howItWorksSection.description}
        className="mx-auto max-w-2xl"
      />

      <Tabs
        label="Pilih alur"
        className="mx-auto mt-8 max-w-2xl"
        items={[
          { id: "umkm", label: "Untuk UMKM", content: <Flow steps={umkmFlow} /> },
          {
            id: "pemodal",
            label: "Untuk Pemodal",
            content: <Flow steps={investorFlow} />,
          },
        ]}
      />
    </Section>
  );
}
