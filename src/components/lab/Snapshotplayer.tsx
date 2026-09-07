import { useEffect, useState } from "react";
import { PatternGrid } from "./PatternGrid";
import type { PatternCells } from "./patterns";

interface SnapshotPlayerProps {
  readonly snapshots: readonly PatternCells[];
  readonly initialCue: PatternCells;
  readonly target: PatternCells;
}

const FRAME_MS = 450;

function accuracyAt(frame: PatternCells, target: PatternCells): number {
  let matches = 0;
  for (let i = 0; i < frame.length; i += 1) {
    if (frame[i] === target[i]) matches += 1;
  }
  return matches / frame.length;
}

/**
 * Steps through the sweep-by-sweep states the Hopfield engine produced
 * while recalling, so the settling process (or failure to settle
 * correctly) is visible rather than just the final state.
 *
 * Mount a fresh instance per recall (e.g. `key={state.recallVersion}` from
 * the caller) so frame/playback state resets naturally instead of being
 * synchronized via an effect.
 */
export function SnapshotPlayer({ snapshots, initialCue, target }: SnapshotPlayerProps) {
  const frames = [initialCue, ...snapshots];
  const lastIndex = frames.length - 1;
  const [frame, setFrame] = useState(lastIndex);
  const [playing, setPlaying] = useState(false);
  const isPlaying = playing && frame < lastIndex;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrame((current) => Math.min(current + 1, lastIndex));
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [isPlaying, lastIndex]);

  if (snapshots.length === 0) return null;

  const currentCells = frames[frame];
  const accuracy = accuracyAt(currentCells, target);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Recalled output</h3>
          <p className="mt-1 text-xs text-slate-500">
            Sweep {frame} of {lastIndex}
          </p>
        </div>

        <span className="text-xs tabular-nums text-slate-500">
          {(accuracy * 100).toFixed(1)}% match
        </span>
      </div>

      <PatternGrid label={`Sweep ${frame}`} cells={currentCells} readOnly />

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setPlaying(false); setFrame((f) => Math.max(0, f - 1)); }}
          disabled={frame === 0}
          aria-label="Previous sweep"
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ◀
        </button>

        <button
          type="button"
          onClick={() => {
            if (frame >= lastIndex) setFrame(0);
            setPlaying(!isPlaying);
          }}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {isPlaying ? "Pause" : frame >= lastIndex ? "Replay" : "Play"}
        </button>

        <button
          type="button"
          onClick={() => { setPlaying(false); setFrame((f) => Math.min(lastIndex, f + 1)); }}
          disabled={frame === lastIndex}
          aria-label="Next sweep"
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▶
        </button>
      </div>

      <input
        type="range"
        className="mt-3 w-full accent-slate-900"
        min={0}
        max={lastIndex}
        value={frame}
        aria-label="Scrub recall sweeps"
        onChange={(event) => {
          setPlaying(false);
          setFrame(Number(event.target.value));
        }}
      />
    </div>
  );
}