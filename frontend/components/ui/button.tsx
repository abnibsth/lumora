import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "onDark"
  | "onDarkOutline";
export type ButtonSize = "md" | "lg";

/**
 * Variants are exported as a style function rather than a polymorphic component,
 * so the same look can be put on a <button> and on a Next <Link> without either
 * one wrapping the other in an invalid element.
 *
 * Colour reasons, all measured against WCAG AA:
 * - primary uses forest with white text (12.16:1) and darkens one step on hover.
 * - accent uses --lumora-accent-strong, the only green that clears 4.5:1 with
 *   white text. The PRD green #16BB37 measures 2.56:1 and is not usable here.
 * - secondary carries a --lumora-border-strong edge (3.20:1 on white) because a
 *   bordered button is identified by its border, and WCAG 1.4.11 asks 3:1 of it.
 *   The softer --lumora-border would measure 1.22:1 and fail.
 *
 * The two onDark variants belong to the final call to action only, which sits on
 * the forest band. There, --lumora-accent-strong measures 2.22:1 against the
 * surface, so an accent-filled button would barely read as a button. The fill
 * switches to --lumora-green, which measures 4.75:1 against forest, and the
 * label switches to forest text at the same 4.75:1. Neither variant is usable on
 * a light background: forest text on the page background fails, and the mint
 * outline would vanish.
 *
 * Every size clears the 44px minimum tap target. No variant adds a trailing
 * arrow: the arrow is reserved for the two places a direction genuinely helps.
 */
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200 ease-out disabled:pointer-events-none disabled:opacity-55";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-forest text-white hover:bg-forest-deep",
  accent: "bg-accent text-white hover:brightness-95",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-background",
  ghost: "text-ink hover:bg-background",
  onDark: "bg-green text-forest hover:brightness-95",
  onDarkOutline:
    "border border-mint bg-transparent text-white hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps
  extends Omit<ComponentProps<"button">, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
