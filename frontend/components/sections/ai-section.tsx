import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { BulletList } from "@/components/ui/bullet-list";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { BusinessMonogram } from "@/components/business/business-monogram";
import {
  aiDiscoveryAssistant,
  aiProfileAssistant,
  aiSection,
} from "@/data/landing";
import { ROUTES, SECTION_IDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The AI feature section, which the PRD calls essential to positioning.
 *
 * Two features, one per audience, each shown as a preview rather than described
 * in the abstract. Both previews are labelled as previews, because the AI is not
 * built yet and PRD 5 only permits representing unbuilt features through a
 * preview that is clearly a preview.
 *
 * The example input is rendered as a quoted block, not as a textarea. A styled
 * box that looks editable but is not would be a form that does nothing (R-26);
 * showing it as a quotation makes it clear this is what a user typed, not a
 * place to type.
 *
 * The guardrail panel is the section's argument, not a disclaimer bolted on. The
 * heading claims the AI does not decide, and the panel is the proof: four claims
 * it refuses to make, named exactly as PRD 10.7 names them.
 */

function PreviewPanel({
  label,
  children,
  tone = "quiet",
  className,
}: {
  label: string;
  children: ReactNode;
  tone?: "quiet" | "raised";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line p-5",
        tone === "raised" ? "bg-surface" : "bg-background",
        className,
      )}
    >
      <p
        className={cn(
          "text-xs font-medium",
          tone === "raised" ? "text-accent" : "text-muted",
        )}
      >
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Decorative: it marks a transformation from input to output, not a direction. */
function FlowArrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("h-6 w-6 text-line-strong", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v14M6 13l6 6 6-6" />
    </svg>
  );
}

function ProfileAssistantPreview() {
  return (
    <div className="flex flex-col gap-3">
      <PreviewPanel label={aiProfileAssistant.inputLabel}>
        <p className="border-l-2 border-accent pl-4 text-sm text-ink">
          {aiProfileAssistant.inputText}
        </p>
      </PreviewPanel>

      <FlowArrow className="mx-auto" />

      <PreviewPanel label={aiProfileAssistant.outputLabel} tone="raised">
        <p className="text-xs font-semibold text-ink">Draf profil</p>
        <p className="mt-1 text-sm text-muted">
          Kedai kopi independen di Bandung yang dibuka sejak 2023, dengan ruang
          komunitas sebagai pembeda. Pelanggan utamanya warga sekitar, dan usaha
          ini sedang mencari mitra untuk membuka cabang kedua.
        </p>

        <p className="mt-4 text-xs font-semibold text-ink">
          Draf Business Model Canvas
        </p>
        <dl className="mt-1 flex flex-col gap-1 text-sm text-muted">
          <div className="flex gap-2">
            <dt className="shrink-0">Proposisi Nilai</dt>
            <dd aria-hidden="true" className="text-line-strong">
              &middot;
            </dd>
            <dd>Ruang komunitas dengan kopi rumahan</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0">Segmen Pelanggan</dt>
            <dd aria-hidden="true" className="text-line-strong">
              &middot;
            </dd>
            <dd>Warga sekitar dan pekerja jarak jauh</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-muted">{aiProfileAssistant.editNote}</p>
      </PreviewPanel>
    </div>
  );
}

function DiscoveryAssistantPreview() {
  return (
    <div className="flex flex-col gap-3">
      <PreviewPanel label={aiDiscoveryAssistant.promptLabel}>
        <p className="border-l-2 border-accent pl-4 text-sm text-ink">
          &ldquo;{aiDiscoveryAssistant.prompt}&rdquo;
        </p>
      </PreviewPanel>

      <FlowArrow className="mx-auto" />

      <PreviewPanel label={aiDiscoveryAssistant.responseLabel} tone="raised">
        <p className="text-sm text-muted">
          {aiDiscoveryAssistant.responseIntro}
        </p>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-background p-3">
          <BusinessMonogram name="Kopi Ruang Senja" className="h-10 w-10" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Kopi Ruang Senja</p>
            <p className="text-xs text-muted">F&amp;B &middot; Bandung</p>
          </div>
          <p className="ml-auto shrink-0 text-xs font-medium text-accent">
            +23% / 6 bulan
          </p>
        </div>

        {/* A real destination rather than a decorative button, so the preview
            contains no control that does nothing (R-26). */}
        <Link
          href={ROUTES.business("kopi-ruang-senja")}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4"
        >
          Lihat profil Kopi Ruang Senja
        </Link>

        <p className="mt-2 text-xs text-muted">
          {aiDiscoveryAssistant.responseNote}
        </p>
      </PreviewPanel>
    </div>
  );
}

function FeatureBlock({
  assistant,
  preview,
  reversed = false,
}: {
  assistant: typeof aiProfileAssistant | typeof aiDiscoveryAssistant;
  preview: ReactNode;
  reversed?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className={cn(reversed && "lg:order-2")}>
        <p className="text-sm font-medium text-accent">{assistant.audience}</p>
        <h3 className="mt-2 text-2xl font-semibold text-balance text-ink sm:text-3xl">
          {assistant.title}
        </h3>
        <p className="text-lead mt-3 text-muted">{assistant.body}</p>

        {"capabilities" in assistant ? (
          <BulletList items={assistant.capabilities} className="mt-5" />
        ) : null}
      </div>

      <div className={cn(reversed && "lg:order-1")}>{preview}</div>
    </div>
  );
}

export function AiSection() {
  return (
    <Section id={SECTION_IDS.ai}>
      <SectionHeading
        eyebrow={aiSection.eyebrow}
        title={aiSection.heading}
        description={aiSection.description}
        className="max-w-2xl"
      />

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Badge tone="demo">{aiSection.previewBadge}</Badge>
        <span>{aiSection.previewNote}</span>
      </p>

      <div className="mt-14 flex flex-col gap-16 lg:gap-24">
        <FeatureBlock
          assistant={aiProfileAssistant}
          preview={<ProfileAssistantPreview />}
        />
        <FeatureBlock
          assistant={aiDiscoveryAssistant}
          preview={<DiscoveryAssistantPreview />}
          reversed
        />
      </div>

      <div className="mt-16 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h3 className="text-card-title font-semibold text-ink">
          {aiSection.guardrailTitle}
        </h3>
        <BulletList
          items={aiSection.guardrails}
          tone="neutral"
          className="mt-4 grid gap-3 sm:grid-cols-2"
        />
      </div>
    </Section>
  );
}
