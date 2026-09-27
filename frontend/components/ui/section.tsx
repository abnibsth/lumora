"use client";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
  amount = 0.2,
  scale = 1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  amount?: number;
  scale?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: distance, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
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
}: ComponentProps<typeof motion.div>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.55, ease: easeOut } },
      }}
      className={className}
    >
      {children}
    </motion.div>
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
