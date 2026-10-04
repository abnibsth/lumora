"use client";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { useRef, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

const mobileQuery = "(max-width: 639px)";
function subscribeMobile(callback: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function useRevealDistance(distance: number) {
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(mobileQuery).matches, () => false);
  return mobile ? distance / 2 : distance;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
  amount = 0.2,
  scale = 1,
  direction = "up",
  onLoad = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  amount?: number;
  scale?: number;
  direction?: "up" | "down" | "left";
  onLoad?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const offset = useRevealDistance(distance);
  const target = { opacity: 1, x: 0, y: 0, scale: 1 };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: direction === "left" ? -offset : 0, y: direction === "left" ? 0 : direction === "down" ? -offset : offset, scale }}
      animate={onLoad ? target : undefined}
      whileInView={onLoad ? undefined : target}
      viewport={{ once: true, amount }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.6, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
  amount = 0.15,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  amount?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduceMotion ? 0 : stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: ComponentProps<typeof motion.div>) {
  const reduceMotion = useReducedMotion();
  const distance = useRevealDistance(24);

  return (
    <motion.div
      {...props}
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: distance },
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.6, ease: easeOut } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const FadeIn = Reveal;

export function ScrollTimeline({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 65%"] });
  return (
    <div ref={ref} className={className}>
      <motion.div aria-hidden="true" className="absolute top-0 -left-px h-full w-px bg-line-strong" style={{ scaleY: reduced ? 1 : scrollYProgress, transformOrigin: "top" }} />
      {children}
    </div>
  );
}

/** Shared landing-section shell with consistent rhythm and anchor offset. */
export function Section({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 py-20 md:py-28 lg:py-32", className)}
    >
      <Container>{children}</Container>
    </section>
  );
}
