"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  question: string;
  answer: ReactNode;
}

/** Rows open independently so readers can compare answers without reopening them.
 * Radix manages expanded state, panel associations, and arrow-key navigation.
 */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const id = useId();
  return (
    <AccordionPrimitive.Root type="multiple" className={cn("border-y border-line divide-y divide-line", className)}>
      {items.map((item, index) => (
        <AccordionPrimitive.Item key={item.question} value={`${id}-${index}`} className="group transition-colors data-[state=open]:bg-surface">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger id={`${id}-trigger-${index}`} className="flex w-full min-h-16 cursor-pointer items-center justify-between gap-6 rounded-sm px-2 py-5 text-left text-lg font-medium text-ink transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest sm:px-4 sm:py-6 sm:text-xl">
              {item.question}
              <span aria-hidden="true" className="relative h-4 w-4 shrink-0 text-muted">
                <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
                <span className="absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-300 group-data-[state=open]:scale-y-0 motion-reduce:transition-none" />
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="lumora-accordion-content overflow-hidden">
            <div className="max-w-2xl px-2 pb-6 text-sm leading-7 text-muted sm:px-4">{item.answer}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}

