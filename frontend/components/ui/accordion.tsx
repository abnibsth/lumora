import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * FAQ accordion, built on native `<details>` and `<summary>`.
 *
 * Reason for native elements rather than a button plus state: the browser
 * already implements the semantics, the keyboard behaviour (Enter and Space on
 * the summary, Tab between rows), and the expanded state. A hand-rolled version
 * would have to reproduce all of that and would be wrong in the same ways every
 * hand-rolled accordion is wrong. It also ships no JavaScript, which matters on a
 * landing page.
 *
 * Rows open independently. Collapsing the open one when another opens is a
 * pattern for navigation menus, not for answers: a reader comparing two answers
 * should not have to reopen the first.
 *
 * The marker is a plus that loses its vertical stroke when open. It is built
 * from two spans rather than an icon font so it inherits the text colour and
 * costs nothing to load.
 *
 * Rows open and close instantly. A height transition was tried and removed: the
 * `grid-template-rows: 0fr` to `1fr` technique cannot work here, because a closed
 * `<details>` does not lay out its content at all, so there is no starting height
 * to interpolate from. Measured in Chrome, the panel reported a computed
 * `grid-template-rows` of `20px` while closed and jumped to its full height in
 * the first frame after opening, with no intermediate values across 90 frames.
 * Animating it would mean giving up the native element and its keyboard handling
 * for a 220ms ease, which is not a trade worth making.
 */
export interface AccordionItem {
  question: string;
  answer: ReactNode;
}

export function Accordion({
  items,
  className,
}: {
  items: AccordionItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface",
        className,
      )}
    >
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-card-title font-medium text-ink transition-colors hover:bg-background sm:px-6 [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="relative h-4 w-4 shrink-0 text-muted"
            >
              <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
              <span className="absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-200 ease-out group-open:scale-y-0" />
            </span>
          </summary>

          <div className="px-5 pb-5 text-sm text-muted sm:px-6">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
