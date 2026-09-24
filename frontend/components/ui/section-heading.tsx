import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface SectionHeadingProps {
  /**
   * Optional. Kept as plain text rather than a pill badge: a pill parked above a
   * heading, especially with a dot or a glow, is the shape R-09 rejects. Use it
   * only when it carries a fact the headline does not, such as naming what
   * LUMORA is before the headline makes its claim.
   */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Defaults to h2. Only the hero passes "h1", so the page keeps a single h1. */
  as?: "h1" | "h2" | "h3";
  align?: "start" | "center";
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  align = "start",
  className,
  titleClassName,
}: SectionHeadingProps) {
  const isHero = Heading === "h1";

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-medium text-accent">{eyebrow}</p>
      ) : null}
      <Heading
        className={cn(
          "text-balance font-semibold text-ink",
          isHero ? "text-hero" : "text-section",
          titleClassName,
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "text-lead text-muted",
            align === "center" ? "max-w-2xl" : "max-w-xl",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
