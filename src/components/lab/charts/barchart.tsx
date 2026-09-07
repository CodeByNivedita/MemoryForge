export interface BarChartDatum {
  readonly label: string;
  readonly value: number;
  readonly detail?: string;
}

interface BarChartProps {
  readonly data: readonly BarChartDatum[];
  readonly maxValue?: number;
  readonly valueFormat?: (value: number) => string;
  readonly ariaLabel: string;
  readonly colorForValue?: (value: number) => string;
}

function defaultColor(value: number): string {
  if (value >= 0.9) return "bg-emerald-600";
  if (value >= 0.4) return "bg-amber-500";
  return "bg-rose-600";
}

/**
 * Minimal horizontal bar chart built from plain elements (no charting
 * dependency). Designed for 0..1 rate-style data but works with any
 * maxValue.
 */
export function BarChart({
  data,
  maxValue,
  valueFormat = (value) => `${Math.round(value * 100)}%`,
  ariaLabel,
  colorForValue = defaultColor,
}: BarChartProps) {
  const max = maxValue ?? Math.max(1e-9, ...data.map((d) => d.value));

  return (
    <div
      role="img"
      aria-label={`${ariaLabel}: ${data
        .map((d) => `${d.label} ${valueFormat(d.value)}`)
        .join(", ")}`}
      className="flex flex-col gap-2.5"
    >
      {data.map((datum) => {
        const width = max > 0 ? Math.max(2, (datum.value / max) * 100) : 0;

        return (
          <div key={datum.label} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-500">
              {datum.label}
            </span>

            <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-sm bg-slate-100">
              <div
                className={`h-full rounded-sm ${colorForValue(datum.value)} transition-[width] duration-300`}
                style={{ width: `${width}%` }}
              />
            </div>

            <span className="w-24 shrink-0 text-xs tabular-nums text-slate-600">
              {valueFormat(datum.value)}
              {datum.detail ? (
                <span className="text-slate-400"> {datum.detail}</span>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}