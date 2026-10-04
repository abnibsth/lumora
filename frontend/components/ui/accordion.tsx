"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  question: string;
  answer: ReactNode;
}

/** Rows open independently so readers can compare answers without reopening them.
 * Semantic buttons preserve keyboard activation and expose expanded state.
 * Auto height is measured by Motion instead of interpolating closed details.
 */
function AccordionRow({ item }: { item: AccordionItem }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const id = useId();
  return (
    <div className={cn("group transition-colors", open && "bg-surface")}>
      <button id={`${id}-trigger`} type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen(!open)} className="flex w-full min-h-16 cursor-pointer items-center justify-between gap-6 px-2 py-5 text-left text-lg font-medium text-ink transition-colors hover:text-accent sm:px-4 sm:py-6 sm:text-xl">
        {item.question}
        <span aria-hidden="true" className="relative h-4 w-4 shrink-0 text-muted">
          <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
          <span className={cn("absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-200 ease-out motion-reduce:transition-none", open && "scale-y-0")} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div key="answer" id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
          <div className="max-w-2xl px-2 pb-6 text-sm leading-7 text-muted sm:px-4">{item.answer}</div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}

export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  return <div className={cn("border-y border-line divide-y divide-line", className)}>{items.map(item => <AccordionRow key={item.question} item={item} />)}</div>;
}

