"use client";

import { cn } from "@/lib/utils";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * A segmented tab control, following the ARIA tabs pattern.
 *
 * Reason for a real tab implementation rather than two buttons plus conditional
 * rendering: a segmented control is a single control with one selection, and
 * assistive technology needs to hear it that way. Each tab is wired to its panel
 * with `aria-controls` and `aria-labelledby`, only the selected tab is in the tab
 * order, and the arrow keys move between tabs.
 *
 * Every panel stays in the document with `hidden` on the inactive one, so both
 * flows are present for search engines and neither is re-mounted on switch.
 *
 * Each tab clears the 44px minimum tap target.
 */
export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({
  items,
  label,
  className,
}: {
  items: TabItem[];
  /** Names the control itself, e.g. "Pilih alur". */
  label: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const baseId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function moveTo(id: string) {
    setActiveId(id);
    tabRefs.current[id]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") nextIndex = index === 0 ? last : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = last;

    if (nextIndex === null) return;
    event.preventDefault();
    moveTo(items[nextIndex].id);
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="flex w-full gap-1 rounded-xl border border-line bg-surface p-1"
      >
        {items.map((item, index) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[item.id] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "min-h-11 flex-1 rounded-lg px-4 text-sm font-medium transition-colors duration-200 ease-out sm:flex-none",
                selected ? "bg-forest text-white" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== activeId}
          // The panels hold no focusable content, so the pattern puts the panel
          // itself in the tab order. The global focus ring is left in place.
          tabIndex={0}
          className="mt-8"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
