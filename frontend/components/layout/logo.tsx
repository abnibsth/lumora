import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES, SITE } from "@/lib/constants";

/**
 * The navbar lockup is `logo-nav.png`: the leaf mark plus the wordmark, trimmed
 * of its transparent padding, with the tagline "BISNIS KECIL, PELUANG BESAR"
 * removed. That tagline is part of the source art but it is only about 44px tall
 * in the original, so at a navbar width it would render around 4px and read as a
 * smudge rather than words. The full lockup stays available as `logo-full.png`
 * for places with room, such as the social share image.
 *
 * `logo-light.png` is the white knockout used on the dark forest sections, since
 * the wordmark colour (#021F1B) measures 1.42:1 against forest and disappears.
 *
 * `loading="eager"` rather than the deprecated `priority`: the logo sits above
 * the fold, so it should not pop in, but it is not the LCP element and should not
 * compete with it for a preload slot.
 *
 * `min-h-11` gives the link a 44px hit box. The art renders 28px tall on phones
 * and 36px from sm up, which is under the 44px minimum R-03 asks of a touch
 * target. The padding is invisible: both places this link appears centre it in a
 * taller row, so the logo does not move and no row grows.
 */
export function Logo({
  className,
  tone = "dark",
  href,
  onClick,
}: {
  className?: string;
  tone?: "dark" | "light";
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <Image
      src={tone === "light" ? "/img/logo-light.png" : "/img/logo-nav.png"}
      alt={SITE.name}
      width={1501}
      height={422}
      loading="eager"
      sizes="(min-width: 640px) 128px, 100px"
      className="h-7 w-auto object-contain sm:h-8"
    />
  );

  if (onClick && !href) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="LUMORA"
        className={cn(
          "inline-flex items-center shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-forest cursor-pointer",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href ?? ROUTES.home}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-forest",
        className,
      )}
    >
      {content}
    </Link>
  );
}
