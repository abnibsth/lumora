import { cn } from "@/lib/utils";

/**
 * Revenue Chart component displaying monthly performance trend.
 * Designed with editorial elegance, accessible role="img" descriptions,
 * month labels beneath bars, and responsive scaling.
 */
export function RevenueChart({
  series,
  className,
}: {
  series: number[];
  className?: string;
}) {
  if (!Array.isArray(series) || series.length < 2) {
    return null;
  }

  const validSeries = series.filter(
    (item) => typeof item === "number" && Number.isFinite(item) && item >= 0,
  );

  if (validSeries.length < 2) {
    return null;
  }

  const max = Math.max(...validSeries);
  const min = Math.min(...validSeries);
  if (!Number.isFinite(max) || !Number.isFinite(min)) {
    return null;
  }

  const span = max - min || 1;
  const latestValue = validSeries[validSeries.length - 1];
  const firstValue = validSeries[0];
  const isUpward = latestValue >= firstValue;

  const minFormatted = min.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const maxFormatted = max.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const latestFormatted = latestValue.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  const summary = `Grafik pendapatan bulanan selama ${validSeries.length} bulan terakhir. Nilai awal Rp${firstValue} juta, bergerak ke Rp${latestFormatted} juta rupiah (terendah Rp${minFormatted} juta, tertinggi Rp${maxFormatted} juta).`;

  return (
    <figure className={cn("m-0 w-full", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5">
        <figcaption className="text-xs font-semibold text-forest uppercase tracking-wider">
          Tren Pendapatan {validSeries.length} Bulan Terakhir
        </figcaption>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isUpward
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          )}
        >
          {isUpward ? "Tren Positif" : "Stabil"}
        </span>
      </div>

      {/* Bar container */}
      <div
        role="img"
        aria-label={summary}
        className="mt-5 flex h-24 sm:h-28 items-end gap-2 sm:gap-3 px-1"
      >
        {validSeries.map((value, index) => {
          // Keep lowest visible at 22% of height, max at 100%
          const heightPercent = Math.max(
            22,
            Math.round(((value - min) / span) * 78 + 22)
          );
          const isLatest = index === validSeries.length - 1;
          const valFormatted = value.toLocaleString("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          });

          return (
            <div
              key={index}
              className="group/bar relative flex flex-1 flex-col items-center h-full justify-end"
            >
              {/* Tooltip on hover/focus */}
              <div className="pointer-events-none absolute -top-8 hidden group-hover/bar:flex z-10 whitespace-nowrap rounded-md bg-forest px-2 py-1 text-[10px] font-medium text-white shadow-md">
                Bulan {index + 1}: Rp{valFormatted} jt
              </div>

              {/* Individual Bar */}
              <span
                tabIndex={0}
                aria-label={`Bulan ${index + 1}: Rp${valFormatted} juta`}
                className={cn(
                  "w-full rounded-t-sm rounded-b-[1px] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-forest",
                  isLatest
                    ? "bg-accent hover:bg-forest"
                    : "bg-forest/80 hover:bg-accent"
                )}
                style={{ height: `${heightPercent}%` }}
              />

              {/* Month label beneath bar */}
              <span className="mt-2 text-[10px] sm:text-[11px] font-medium text-muted text-center select-none">
                <span className="sm:hidden">B{index + 1}</span>
                <span className="hidden sm:inline">Bln {index + 1}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend & range summary */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-2.5 text-[11px] text-muted">
        <span className="font-medium">
          Terendah: <strong className="text-forest">Rp{minFormatted} jt</strong>
        </span>
        <span className="font-medium">
          Tertinggi: <strong className="text-forest">Rp{maxFormatted} jt</strong>
        </span>
        <span className="font-medium text-forest/90">
          Terkini: <strong>Rp{latestFormatted} jt</strong>
        </span>
      </div>
    </figure>
  );
}
