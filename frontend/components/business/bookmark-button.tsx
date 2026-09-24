import { cn } from "@/lib/utils";

/**
 * The save toggle on a business card.
 *
 * It is a real control with a real effect (localStorage, plus the count the
 * discovery section shows), not a decorative icon button, which is what R-26
 * requires. The accessible name stays constant and `aria-pressed` carries the
 * state, so a screen reader announces "Simpan Kopi Ruang Senja, pressed" rather
 * than a label that silently changes under the user.
 *
 * The pressed state is conveyed by fill and colour together, not by colour
 * alone, so it survives a monochrome display.
 */
export function BookmarkButton({
  name,
  saved,
  onToggle,
  className,
}: {
  name: string;
  saved: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`Simpan ${name}`}
      onClick={onToggle}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200 ease-out",
        saved
          ? "border-forest bg-forest text-mint"
          : "border-line-strong bg-surface text-muted hover:text-ink",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          d="M5.5 3.5h9a1 1 0 0 1 1 1v12l-5.5-3.3L4.5 16.5v-12a1 1 0 0 1 1-1Z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
