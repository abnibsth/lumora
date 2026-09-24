import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * The shell every landing section shares: one anchor id, one top rule, one
 * vertical rhythm, one Container.
 *
 * Reason for a shared shell rather than repeating the classes per section: the
 * section boundaries and the gutter are the page's visual backbone. Deriving
 * them from one place means a new section cannot land with a slightly different
 * padding or a missing anchor id.
 *
 * `scroll-mt-24` backs up the global `scroll-padding-top` in globals.css so an
 * anchor jump never lands under the sticky navbar.
 *
 * The final call to action does not use this shell: it sits on a dark band with
 * no top rule, so it renders its own <section>.
 */
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
      className={cn(
        "scroll-mt-24 border-t border-line py-16 md:py-24",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}
