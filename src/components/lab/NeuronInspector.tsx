import { useEffect, useState } from 'react';
import type { RecallResult } from '../../engine/recall';
import { networkEnergy } from '../../engine/recall';
import { NetworkView } from './NetworkView';
import { PatternGrid } from './PatternGrid';
import type { PatternCells, StoredPattern } from './patterns';

interface Props {
  frame?: number;
  onFrameChange?: (frame: number) => void;
  autoPlay?: boolean;
  active?: boolean;
  result: RecallResult;
  weights: number[][];
  cue: PatternCells;
  stored: readonly StoredPattern[];
}
const control = 'button-secondary';
export function NeuronInspector({
  result,
  weights,
  cue,
  stored,
  active = true,
  frame: externalFrame,
  onFrameChange,
  autoPlay = false,
}: Props) {
  const [localFrame, setLocalFrame] = useState(-1);
  const frame = externalFrame ?? localFrame;
  const setFrame = onFrameChange ?? setLocalFrame;
  const [playing, setPlaying] = useState(
    () =>
      autoPlay &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  const [speed, setSpeed] = useState(12);
  const [selected, setSelected] = useState(0);
  const last = result.updates.length - 1;
  const update = result.updates[frame];
  const cells = update?.state ?? cue;
  const neuron = update?.neuron ?? selected;
  const [follow, setFollow] = useState(true);
  const inspected = follow ? neuron : selected;
  const running = active && playing && frame < last;
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setFrame(Math.min(last, frame + 1)),
      1000 / speed
    );
    return () => window.clearTimeout(timer);
  }, [running, speed, last, frame, setFrame]);
  const terms = weights[inspected].map((weight, j) => ({
    j,
    weight,
    state: cells[j],
    value: weight * cells[j],
  }));
  const input = terms.reduce((sum, term) => sum + term.value, 0);
  const recorded = update && inspected === update.neuron;
  const energy = networkEnergy(weights, cells);
  const minEnergy = Math.min(...result.energies);
  const maxEnergy = Math.max(...result.energies);
  const chartPoints = result.energies
    .map(
      (e, i) =>
        `${15 + (i / Math.max(1, result.energies.length - 1)) * 430},${15 + ((maxEnergy - e) / Math.max(0.0001, maxEnergy - minEnergy)) * 80}`
    )
    .join(' ');
  return (
    <section className="surface-panel p-5" aria-label="Neuron microscope">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mt-1 section-title">Neuron playback</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Follow a recorded update. The output grid stays in sync.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
          Weights stay fixed
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button
          className={control}
          onClick={() => {
            if (frame >= last) setFrame(-1);
            setPlaying(!running);
          }}
        >
          {running ? 'Pause neuron playback' : 'Play neuron updates'}
        </button>
        <button
          className={control}
          disabled={frame < 0}
          onClick={() => {
            setPlaying(false);
            setFrame(frame - 1);
          }}
        >
          Previous update
        </button>
        <button
          className={control}
          disabled={frame >= last}
          onClick={() => {
            setPlaying(false);
            setFrame(frame + 1);
          }}
        >
          Next update
        </button>
        <label className="ml-auto text-sm text-slate-600">
          Updates / second{' '}
          <select
            className="ml-2 rounded-md border border-slate-300 p-2"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {[2, 12, 32, 64].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-500">
          Sweep navigation & restart
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {' '}
          <button
            className={control}
            onClick={() => {
              setPlaying(false);
              setFrame(-1);
            }}
          >
            Restart trace
          </button>
          <button
            className={control}
            disabled={frame < 0}
            onClick={() => {
              setPlaying(false);
              setFrame(
                Math.max(-1, (Math.ceil((frame + 1) / 64) - 1) * 64 - 1)
              );
            }}
          >
            Previous sweep
          </button>
          <button
            className={control}
            disabled={frame >= last}
            onClick={() => {
              setPlaying(false);
              setFrame(
                Math.min(last, (Math.floor((frame + 1) / 64) + 1) * 64 - 1)
              );
            }}
          >
            Next sweep
          </button>
        </div>
      </details>
      <input
        className="mt-4 w-full accent-teal-700"
        aria-label="Neuron update timeline"
        type="range"
        min={-1}
        max={last}
        value={frame}
        onChange={(e) => {
          setPlaying(false);
          setFrame(Number(e.target.value));
        }}
      />
      <p className="text-sm text-slate-500">
        {frame < 0
          ? 'Input cue · before any updates'
          : `Sweep ${update.sweep} · update ${frame + 1} / ${result.updates.length}`}{' '}
        · Energy now: <span className="font-mono">{energy.toFixed(4)}</span>
      </p>

      <div className="mt-5 grid items-center gap-6 2xl:grid-cols-[1.25fr_1fr]">
        <div className="mx-auto w-full min-w-0 max-w-[520px]">
          <NetworkView
            weights={weights}
            cells={cells}
            selected={inspected}
            active={update?.neuron}
            onSelect={(i) => {
              setSelected(i);
              setFollow(false);
              setPlaying(false);
            }}
          />
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600">
            <span className="text-teal-700">— positive weight</span>
            <span className="text-orange-800">— negative weight</span>
            <span>Filled = +1 · outlined = −1</span>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            Bright links show nonzero connections to neuron {inspected + 1}. Use
            “All connections” for the full context.
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Neuron {inspected + 1}
            </h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {recorded
              ? 'Values recorded at this exact update.'
              : 'Weighted input calculated from the displayed state; this is an inspection, not a new update.'}
          </p>
          <div className="my-4 grid grid-cols-3 gap-2">
            {[
              [
                recorded ? 'Before' : 'Current',
                recorded ? update.previousState : cells[inspected],
              ],
              [
                'Weighted input',
                recorded ? update.weightedInput.toFixed(4) : input.toFixed(4),
              ],
              [
                recorded ? 'After' : 'Rule would give',
                recorded
                  ? update.newState
                  : input > 0
                    ? 1
                    : input < 0
                      ? -1
                      : cells[inspected],
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 font-mono text-lg font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="rounded-lg border-l-2 border-teal-600 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-950">
            hᵢ = Σⱼ Wᵢⱼsⱼ. Positive → +1; negative → −1; zero → keep the old
            state. Every sum includes all 64 terms, with Wᵢᵢ = 0.
          </p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">
              Inspect all 64 contributions
            </summary>
            <div className="mt-3 max-h-52 overflow-auto">
              <table className="w-full text-right font-mono text-xs">
                <thead>
                  <tr>
                    {['j', 'Wᵢⱼ', 'sⱼ', 'product'].map((label) => (
                      <th key={label} className="p-2">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {terms.map((term) => (
                    <tr key={term.j} className="border-t border-slate-100">
                      <td className="p-2">{term.j + 1}</td>
                      <td>{term.weight.toFixed(4)}</td>
                      <td>{term.state}</td>
                      <td>{term.value.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
      <details className="mt-5 border-t border-slate-200 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Inspect state, energy and memory overlap
        </summary>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="mx-auto w-full max-w-48">
            <PatternGrid
              readOnly
              label="Microscope state"
              cells={cells as PatternCells}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Energy after each sweep</h3>
            <svg
              viewBox="0 0 460 120"
              className="mt-3 w-full"
              role="img"
              aria-label={`Recorded energy by sweep: ${result.energies.join(', ')}`}
            >
              <path d="M15 10V100H445" fill="none" stroke="#cbd5e1" />
              <polyline
                points={chartPoints}
                fill="none"
                stroke="#0f766e"
                strokeWidth="2.5"
              />
            </svg>
            <p className="text-xs leading-5 text-slate-500">
              Input → sweep {result.sweepsExecuted}. Energy cannot increase
              under symmetric, zero-diagonal asynchronous updates. Low energy
              does not guarantee the intended memory.
            </p>
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer">Exact energy values</summary>
              {result.energies.map((e, i) => (
                <p key={i}>
                  Sweep {i}: {e.toFixed(4)}
                </p>
              ))}
            </details>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Overlap at this update
            </h3>
            {stored.map((pattern) => {
              const overlap =
                cells.reduce((sum, s, i) => sum + s * pattern.cells[i], 0) /
                cells.length;
              return (
                <div key={pattern.id} className="mb-3">
                  <div className="flex justify-between gap-2 text-xs">
                    <span>{pattern.name}</span>
                    <span className="font-mono">{overlap.toFixed(3)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100">
                    <div
                      className={
                        overlap < 0
                          ? 'ml-auto h-full bg-orange-400'
                          : 'h-full bg-teal-600'
                      }
                      style={{ width: `${Math.abs(overlap) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs leading-5 text-slate-500">
              +1 = identical; −1 = every cell inverted; 0 = half the cells
              match. Bars show magnitude; orange means negative.
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}
