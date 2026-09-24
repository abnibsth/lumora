import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * The single content container for the site, from PRD 11. Every section uses it
 * so the left and right gutters line up down the whole page.
 */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}
