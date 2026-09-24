import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type BadgeTone = "accent" | "mint" | "demo";

/**
 * A badge is a label, not decoration. It exists only for real state: a category,
 * a stated partnership need, or an explicit "this is demo data" marker.
 *
 * There is no "AI Powered", "Beta" or "New" tone on purpose. Those pills say
 * nothing about the product, and the combination of pill plus thin border plus
 * glow plus uppercase is the pattern R-09 forbids. The shape stays a soft
 * rectangle rather than a pill so badges do not read as the page's default form.
 *
 * There was a "neutral" tone that filled with --lumora-background. It rendered
 * as an invisible chip anywhere the background was also --lumora-background,
 * which is where it was used, so it was removed rather than left as a trap. The
 * hero's trust line is plain text now.
 */
const tones: Record<BadgeTone, string> = {
  accent: "bg-accent/10 text-accent",
  mint: "bg-mint/25 text-forest",
  demo: "border border-line-strong bg-surface text-muted",
};

export interface BadgeProps extends Omit<ComponentProps<"span">, "className"> {
  /**
   * Required, with no default. Every badge on the page exists to say something
   * specific, so making the tone explicit keeps a badge from appearing with a
   * tone nobody chose.
   */
  tone: BadgeTone;
  className?: string;
}

export function Badge({ tone, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
