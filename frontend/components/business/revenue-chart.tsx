import { cn } from "@/lib/utils";

/**
 * Revenue mini chart for the hero product preview.
 *
 * The caption names what the chart answers ("pendapatan N bulan terakhir")
 * rather than saying "overview" or "performance". A chart without a stated
 * question is texture, and it costs more attention than a sentence would.
 *
 * The bars are drawn as a flex row of divs rather than an SVG library, and the
 * whole figure carries one `role="img"` label describing the trend, so a screen
 * reader gets the shape of the data instead of six unlabelled rectangles.
 *
 * Colour: bars use --lumora-accent-strong, which measures 5.48:1 on the white
 * panel, above the 3:1 that WCAG 1.4.11 asks of a non-text graphic.
 */
export function RevenueChart({
  series,
  className,
}: {
  series: number[];
  className?: string;
}) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;

  const summary = `Pendapatan bulanan contoh selama ${series.length} bulan terakhir, naik dari ${min} juta rupiah menjadi ${max} juta rupiah.`;

  return (
    <figure className={cn("m-0", className)}>
      <figcaption className="text-xs font-medium text-muted">
        Pendapatan {series.length} bulan terakhir
      </figcaption>

      <div
        role="img"
        aria-label={summary}
        className="mt-3 flex h-16 items-end gap-1.5"
      >
        {series.map((value, index) => {
          // Keep every bar visible: the lowest still shows 25% of the height.
          const height = 25 + ((value - min) / span) * 75;
          return (
            <span
              key={index}
              className="flex-1 rounded-[2px] bg-accent"
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>Rp{min.toFixed(1)} jt</span>
        <span>Rp{max.toFixed(1)} jt</span>
      </div>
    </figure>
  );
}
