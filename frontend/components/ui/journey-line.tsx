import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * The journey line is LUMORA's identity motif: a rail with square nodes marking
 * stops along a business's story. It is repeated deliberately across the page
 * (value proposition, how it works, the business journey timeline, and the final
 * call to action) so the design reads as belonging to this product rather than
 * to any landing page.
 *
 * Reason for a square node instead of a circle: a round node with a number
 * inside is the generic "how it works" shape. A square reads as a marker on a
 * line, which is what it actually is.
 *
 * Reason the node is filled rather than outlined: an outlined square is the
 * shape of an empty checkbox. Next to a step label it promises a control that
 * can be ticked, and there is nothing here to tick. A solid marker cannot be
 * mistaken for an input.
 *
 * Reason for the line instead of a grid or glow in the final call to action: the
 * PRD asked for a decorative grid, which R-07 rejects as a default, and a glow,
 * which R-13 caps at one or two focus accents. The journey line carries the same
 * "this is a sequence, not a static page" idea and is specific to this product.
 */

/**
 * The connector is drawn as a `::before` on each step rather than as one rail on
 * the list. A single rail spanning the list would run past the final node and
 * trail off below it, which reads as an unfinished line. Per-step segments can be
 * suppressed on the last step with `last:before:hidden`, so the line ends exactly
 * where the story does.
 *
 * The geometry is tied to two numbers in this file: the node sits at `top-px`
 * and is 14px tall, so the connector starts at 15px, and the list gap is 32px,
 * so it reaches 33px past the step's bottom to land on the next node's top edge.
 *
 * The 1px offset is what centers the node on the step's first line rather than
 * on the step box: the marker above the title is 12px on a 16px line box, so its
 * optical center sits 8px down, which is the node's center at `top-px`.
 */
const railGeometry =
  "relative pl-9 before:absolute before:top-[15px] before:-bottom-[33px] before:left-[7px] before:w-px before:bg-line before:content-[''] last:before:hidden";

/**
 * The motif's marker on its own, without the rail. Used wherever a stop needs to
 * be marked but there is no sequence to draw, so the shape stays identical
 * everywhere it appears instead of being redrawn per section.
 */
export function JourneyNode({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-3.5 w-3.5 shrink-0 rounded-[2px] bg-forest", className)}
    />
  );
}

export function JourneyList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ol className={cn("flex flex-col gap-8", className)}>{children}</ol>;
}

export function JourneyStep({
  marker,
  title,
  children,
  className,
}: {
  /** A short label on the line: a step number or a year. */
  marker?: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn(railGeometry, className)}>
      <JourneyNode className="absolute top-px left-0" />
      {marker ? (
        <span className="block text-xs font-semibold tracking-wide text-accent">
          {marker}
        </span>
      ) : null}
      <h3
        className={cn(
          "text-card-title font-semibold text-ink",
          marker ? "mt-1" : "",
        )}
      >
        {title}
      </h3>
      {children ? (
        <div className="mt-2 text-sm text-muted">{children}</div>
      ) : null}
    </li>
  );
}

/**
 * Decorative horizontal version of the same motif, for wide bands where a
 * vertical rail would not fit. Purely presentational, so it is hidden from
 * assistive technology.
 */
export function JourneyRule({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 24"
      preserveAspectRatio="none"
      className={cn("h-6 w-full", className)}
      fill="none"
    >
      <line
        x1="0"
        y1="12"
        x2="600"
        y2="12"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />
      {[0, 120, 240, 360, 480, 600].map((x) => (
        <rect
          key={x}
          x={x === 600 ? 596 : x}
          y="8"
          width="8"
          height="8"
          rx="1"
          fill="currentColor"
          opacity="0.5"
        />
      ))}
    </svg>
  );
}
