import { useEffect, useMemo, useState } from 'react';
import { storageFrame } from '../../engine/storageTrace';
import { NetworkView } from './NetworkView';
import type { StoredPattern } from './patterns';

export function StorageView({
  patterns,
  active = true,
  autoPlay = true,
}: {
  patterns: readonly StoredPattern[];
  active?: boolean;
  autoPlay?: boolean;
}) {
  const [row, setRow] = useState(!patterns.length || autoPlay ? 0 : 64);
  const [playing, setPlaying] = useState(
    () =>
      autoPlay &&
      patterns.length > 0 &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  const [neuron, setNeuron] = useState(0);
  const running = active && playing && row < 64;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setRow((r) => Math.min(64, r + 1)),
      90
    );
    return () => window.clearInterval(timer);
  }, [running]);
  const weights = useMemo(() => storageFrame(patterns, row), [patterns, row]);
  const last = patterns[patterns.length - 1];
  const cells = last?.cells ?? Array(64).fill(-1);
  const selected = running ? Math.max(0, row - 1) : neuron;
  const partner = selected === 63 ? 0 : selected + 1;
  const delta = last ? (cells[selected] * cells[partner]) / 64 : 0;
  return (
    <section
      aria-label="Weight learning animation"
      className="surface-panel overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="section-title">Learning connections</h2>
          <p className="mt-1 text-sm text-slate-500">
            {last
              ? 'Replay the contribution of “' + last.name + '”.'
              : 'Store a pattern to build the first connections.'}
          </p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50/50 px-2.5 py-1 text-xs font-medium text-blue-700">
          Weights change
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 pt-4">
        <button
          disabled={!last}
          className="button-secondary"
          onClick={() => {
            if (row === 64) setRow(0);
            setPlaying(!running);
          }}
        >
          {running
            ? 'Pause weight replay'
            : row === 64
              ? 'Replay weight learning'
              : 'Play weight learning'}
        </button>
        <label className="flex min-w-36 flex-1 items-center gap-3 text-sm text-slate-500">
          <span className="sr-only">Storage rows</span>
          <input
            aria-label="Storage rows"
            className="w-full accent-blue-600"
            type="range"
            min="0"
            max="64"
            value={row}
            disabled={!last}
            onChange={(e) => {
              setPlaying(false);
              setRow(Number(e.target.value));
            }}
          />
          <span className="whitespace-nowrap font-mono text-xs">
            {row}/64 rows
          </span>
        </label>
      </div>
      <div className="p-4 sm:p-5">
        <div className="mx-auto max-w-[600px]">
          <NetworkView
            weights={weights}
            cells={cells}
            selected={selected}
            active={running ? selected : undefined}
            onSelect={(i) => {
              setNeuron(i);
              setPlaying(false);
            }}
          />
        </div>
      </div>
      <div className="mx-5 mb-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Connection</p>
          <p className="mt-1 font-mono text-lg text-slate-800">
            {selected + 1} ↔ {partner + 1}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Pattern contribution</p>
          <p className="mt-1 font-mono text-lg text-slate-800">
            {last ? (delta > 0 ? '+' : '') + delta.toFixed(5) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Weight at this frame</p>
          <p className="mt-1 font-mono text-lg text-slate-800">
            {weights[selected][partner].toFixed(5)}
          </p>
        </div>
      </div>
      <details className="border-t border-slate-100 px-5 py-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-600">
          How does storing a pattern change the weights?
        </summary>
        <div className="mt-3 max-w-2xl space-y-3 text-sm leading-6 text-slate-500">
          <p>
            Matching signs add a positive weight. Opposite signs add a negative
            weight. Each pair contributes sᵢ × sⱼ / 64; no neuron connects to
            itself.
          </p>
          <p className="font-mono text-slate-700">
            {last
              ? cells[selected] +
                ' × ' +
                cells[partner] +
                ' / 64 = ' +
                delta.toFixed(5)
              : 'Store a pattern to inspect its contribution.'}
          </p>
          <p>
            This replays the actual outer-product addition one row at a time,
            updating both directions together. The stored matrix is already
            complete; replay never changes the experiment.
          </p>
          <p>
            <span className="text-teal-700">Teal: positive weight.</span>{' '}
            <span className="text-orange-800">Amber: negative weight.</span>{' '}
            Bright links belong to the selected neuron.
          </p>
        </div>
      </details>
    </section>
  );
}
