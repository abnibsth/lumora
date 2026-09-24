import { businessInitial } from "@/lib/business";
import { cn } from "@/lib/utils";

/**
 * Stands in for a business cover photo.
 *
 * No real business photography exists, and generating photos of businesses that
 * do not exist would be fabricated content. R-23 sanctions an initial-based
 * placeholder, so every card gets the same honest treatment instead: the first
 * letter on a forest tile. The name always sits next to it in text, so this is
 * decorative and hidden from assistive technology.
 */
export function BusinessMonogram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-forest font-semibold text-mint select-none",
        className,
      )}
    >
      {businessInitial(name)}
    </span>
  );
}
