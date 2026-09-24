





import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

/**
 * Shared shell for routes that are linked from the landing page but not built
 * yet. The PRD allows a clear placeholder over a 404, and this is deliberately
 * plain about being unfinished: no fake form, no fake results, no pretend
 * product. An honest "not built yet" is the whole point.
 */
export function PlaceholderPage({
  title,
  description,
  detail,
}: {
  title: string;
  description: string;
  detail?: string;
}) {
  return (
    <Container className="py-20 md:py-28">
      <div className="flex max-w-2xl flex-col items-start gap-5">
        <Badge tone="demo">Belum tersedia</Badge>

        <h1 className="text-section font-semibold text-balance text-ink">
          {title}
        </h1>

        <p className="text-lead text-muted">{description}</p>

        {detail ? <p className="text-sm text-muted">{detail}</p> : null}

        <Link
          href={ROUTES.home}
          className={buttonStyles({ variant: "secondary", className: "mt-2" })}
        >
          Kembali ke beranda
        </Link>
      </div>
    </Container>
  );
}
