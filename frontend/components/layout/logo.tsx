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
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={ROUTES.home}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-lg",
        className,
      )}
    >
      <Image
        src={tone === "light" ? "/img/logo-light.png" : "/img/logo-nav.png"}
        alt={SITE.name}
        width={1501}
        height={422}
        loading="eager"
        // Without this, next/image assumes the logo renders at its full 1501px
        // intrinsic width and the browser downloads the 1920px variant for a
        // 128px display. The values below are the real rendered widths: 28px tall
        // on phones and 36px from sm up, at this art's 3.56 aspect ratio.
        sizes="(min-width: 640px) 128px, 100px"
        className="h-7 w-auto sm:h-9"
      />
    </Link>
  );
}
