import { cn } from "@/lib/utils";

/**
 * A capability or benefit list, marked with a small square.
 *
 * Reason for a square rather than a checkmark: a checkmark claims verification,
 * and none of these lists have been verified. They state what the product does
 * and what it refuses to do, which is a claim, not a certification. The square
 * also echoes the journey motif's node without pretending the list is a
 * sequence.
 *
 * `tone` distinguishes a list of things the product does (accent) from a list of
 * things it does not (neutral), so the difference is carried by more than the
 * wording.
 */
export function BulletList({
  items,
  tone = "accent",
  className,
}: {
  items: readonly string[];
  tone?: "accent" | "neutral";
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm text-muted">
          <span
            aria-hidden="true"
            className={cn(
              "mt-2 h-1.5 w-1.5 shrink-0 rounded-[1px]",
              tone === "accent" ? "bg-accent" : "bg-line-strong",
            )}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
