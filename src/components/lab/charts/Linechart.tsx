export interface LineChartSeries {
  readonly name: string;
  /** Tailwind-ish hex used for the stroke, dots, and legend swatch. */
  readonly color: string;
  /** Values in the 0..1 range, one per label. */
  readonly values: readonly number[];
}

interface LineChartProps {
  readonly labels: readonly string[];
  readonly series: readonly LineChartSeries[];
  readonly ariaLabel: string;
  readonly xAxisLabel?: string;
  readonly valueFormat?: (value: number) => string;
}

const WIDTH = 640;
const HEIGHT = 280;
const PAD_LEFT = 44;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 40;

const GRID_TICKS = [0, 0.25, 0.5, 0.75, 1];

/**
 * Minimal dependency-free line/point chart (plain SVG) for comparing two or
 * more 0..1 rate-style series across the same categorical x-axis — e.g.
 * exact recall rate and cell accuracy plotted against number of stored
 * patterns.
 */
export function LineChart({
  labels,
  series,
  ariaLabel,
  xAxisLabel,
  valueFormat = (value) => `${Math.round(value * 100)}%`,
}: LineChartProps) {
  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (index: number) =>
    labels.length <= 1
      ? PAD_LEFT + innerWidth / 2
      : PAD_LEFT + (index / (labels.length - 1)) * innerWidth;

  const yFor = (value: number) =>
    PAD_TOP + innerHeight - Math.min(1, Math.max(0, value)) * innerHeight;

  const describedSeries = series
    .map(
      (s) =>
        `${s.name}: ${labels
          .map((label, i) => `${label} ${valueFormat(s.values[i] ?? 0)}`)
          .join(', ')}`
    )
    .join('. ');

  return (
    <div className="flex flex-col gap-3">
      <svg
        role="img"
        aria-label={`${ariaLabel}. ${describedSeries}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
      >
        {/* Gridlines + y-axis labels */}
        {GRID_TICKS.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-slate-400"
                fontSize={10}
              >
                {Math.round(tick * 100)}%
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <text
            key={label}
            x={xFor(i)}
            y={HEIGHT - PAD_BOTTOM + 20}
            textAnchor="middle"
            className="fill-slate-500"
            fontSize={11}
          >
            {label}
          </text>
        ))}
        {xAxisLabel && (
          <text
            x={PAD_LEFT + innerWidth / 2}
            y={HEIGHT - 4}
            textAnchor="middle"
            className="fill-slate-400"
            fontSize={10}
          >
            {xAxisLabel}
          </text>
        )}

        {/* Series lines + points */}
        {series.map((s) => {
          const points = s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
          return (
            <g key={s.name}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <g key={i}>
                  <circle cx={xFor(i)} cy={yFor(v)} r={3.5} fill={s.color} />
                  <text
                    x={xFor(i)}
                    y={yFor(v) - 8}
                    textAnchor="middle"
                    fontSize={9.5}
                    className="fill-slate-600 tabular-nums"
                  >
                    {valueFormat(v)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {series.map((s) => (
          <span
            key={s.name}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}