import { memo, useId, useMemo, useState } from 'react';
import { projectNeurons } from './networkGeometry';

interface Props {
  weights: number[][];
  cells: readonly number[];
  selected: number;
  onSelect?: (neuron: number) => void;
  active?: number;
}
const ContextEdges = memo(function ContextEdges({
  weights,
  points,
}: {
  weights: number[][];
  points: ReturnType<typeof projectNeurons>;
}) {
  return (
    <g stroke="#64749d" strokeWidth="0.5" opacity="0.13">
      {points.flatMap((p, i) =>
        points
          .slice(i + 1)
          .filter((q) => weights[i]?.[q.i])
          .map((q) => (
            <line key={i + '-' + q.i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
          ))
      )}
    </g>
  );
});

/** A perspective projection of 64 actual neurons, not a feed-forward or biological model. */
export function NetworkView({
  weights,
  cells,
  selected,
  onSelect,
  active,
}: Props) {
  const id = useId();
  const [spatial, setSpatial] = useState(false);
  const [rotation, setRotation] = useState(25);
  const [context, setContext] = useState(false);
  const points = useMemo(
    () => projectNeurons((rotation * Math.PI) / 180, spatial),
    [rotation, spatial]
  );
  const max = useMemo(
    () => Math.max(0.001, ...weights.flat().map(Math.abs)),
    [weights]
  );
  const origin = points[selected];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <span className="flex items-center gap-2 text-xs font-medium tracking-wide">
          <span className="size-1.5 rounded-full bg-blue-500" />
          64 neurons · 8 × 8
        </span>
        <div className="flex rounded-md bg-slate-100 p-0.5">
          {[false, true].map((mode) => (
            <button
              key={String(mode)}
              aria-pressed={spatial === mode}
              onClick={() => setSpatial(mode)}
              className="rounded px-3 py-1 text-xs font-medium text-slate-500 aria-pressed:bg-white aria-pressed:text-slate-950 aria-pressed:shadow-sm"
            >
              {mode ? '3D' : '2D'}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 520 380"
        className="w-full"
        aria-labelledby={id + '-title'}
      >
        <title id={id + '-title'}>
          64-neuron Hopfield network. Connections to neuron {selected + 1}.{' '}
          {spatial ? 'Perspective view.' : 'Pixel-aligned map.'}
        </title>
        <defs>
          <radialGradient id={id + '-sphere'}>
            <stop offset="0" stopColor="#e2e8f0" stopOpacity=".35" />
            <stop offset="1" stopColor="#f8fafc" stopOpacity=".05" />
          </radialGradient>
          <radialGradient id={id + '-node'} cx="30%" cy="25%">
            <stop offset="0" stopColor="#8b7aee" />
            <stop offset=".4" stopColor="#7563df" />
            <stop offset="1" stopColor="#6554c0" />
          </radialGradient>
          <pattern
            id={id + '-grid'}
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".7" fill="#cbd5e1" opacity=".28" />
          </pattern>
        </defs>
        <rect width="520" height="380" fill={'url(#' + id + '-grid)'} />
        {spatial && (
          <circle
            cx="260"
            cy="190"
            r="164"
            fill={'url(#' + id + '-sphere)'}
            stroke="#cbd5e1"
            strokeOpacity=".5"
          />
        )}
        {context && <ContextEdges weights={weights} points={points} />}
        <g>
          {points.map(
            (p, j) =>
              j !== selected &&
              Boolean(weights[selected]?.[j]) && (
                <line
                  key={j}
                  x1={origin.x}
                  y1={origin.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={weights[selected][j] > 0 ? '#0d9488' : '#d97706'}
                  strokeWidth={
                    0.65 + (Math.abs(weights[selected][j]) / max) * 1.5
                  }
                  opacity={0.12 + (Math.abs(weights[selected][j]) / max) * 0.25}
                />
              )
          )}
        </g>
        {[...points]
          .sort((a, b) => a.z - b.z)
          .map((p) => (
            <g
              key={p.i}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={
                'Inspect neuron ' + (p.i + 1) + ', state ' + cells[p.i]
              }
              onClick={() => onSelect?.(p.i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(p.i);
                }
              }}
              className={
                onSelect
                  ? 'cursor-pointer outline-none [&:focus-visible_circle]:stroke-blue-700 [&:focus-visible_circle]:stroke-[3]'
                  : ''
              }
            >
              <title>
                Neuron {p.i + 1} · {cells[p.i] === 1 ? 'ON (+1)' : 'OFF (−1)'}
              </title>
              <circle
                cx={p.x}
                cy={p.y}
                r={(spatial ? 12 : 20) * p.scale}
                fill="transparent"
              />
              {(p.i === active || p.i === selected) && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={(spatial ? 12 : 20) * p.scale}
                  fill={p.i === active ? '#fef3c7' : '#ede9fe'}
                  stroke={p.i === active ? '#d97706' : '#6554e8'}
                  strokeWidth="1.5"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={(spatial ? (p.i === selected ? 7 : 5.5) : 15) * p.scale}
                fill={cells[p.i] === 1 ? 'url(#' + id + '-node)' : '#ffffff'}
                stroke={cells[p.i] === 1 ? '#6554c0' : '#94a3b8'}
                strokeWidth="1.2"
                opacity={0.7 + (p.z + 1) * 0.15}
              />
              {(!spatial || p.i === selected) && (
                <text
                  x={spatial ? p.x + 17 : p.x}
                  y={spatial ? p.y - 12 : p.y + 4}
                  fill={!spatial && cells[p.i] === 1 ? '#ffffff' : '#334155'}
                  textAnchor={spatial ? 'start' : 'middle'}
                  pointerEvents="none"
                  fontSize="12"
                  fontFamily="monospace"
                >
                  {String(p.i + 1).padStart(2, '0')}
                </text>
              )}
            </g>
          ))}
      </svg>
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
        <label className="flex min-w-32 flex-1 items-center gap-2">
          Orbit
          <input
            aria-label="Network camera rotation"
            disabled={!spatial}
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full accent-blue-600 disabled:opacity-30"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={context}
            onChange={(e) => setContext(e.target.checked)}
            className="accent-blue-600"
          />
          All connections
        </label>
      </div>
      <p className="px-4 pb-3 text-xs leading-5 text-slate-500">
        {spatial
          ? '3D position is for viewing only.'
          : 'Each numbered neuron matches one pixel, from left to right.'}{' '}
        Links show nonzero weights for neuron {selected + 1}; teal is positive,
        amber is negative.
      </p>
    </div>
  );
}
