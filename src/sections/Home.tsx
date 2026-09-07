import { Icon } from '../components/Icon';
import { useEffect, useMemo, useState } from 'react';
import { createWeightMatrix } from '../engine/hebbian';
import { recall } from '../engine/recall';
import { generateNoisyCopy, generateRandomPatterns } from '../experiments';
import { NetworkView } from '../components/lab/NetworkView';
import { PatternGrid } from '../components/lab/PatternGrid';

export function Home() {
  const demo = useMemo(() => {
    const patterns = generateRandomPatterns(11, 4);
    const target = patterns[0].cells;
    const cue = generateNoisyCopy(target, 30, 1011).cells;
    const weights = createWeightMatrix(patterns.map((p) => [...p.cells]));
    return {
      target,
      cue,
      weights,
      result: recall(weights, [...cue], 2011, {
        maxSweeps: 50,
        captureUpdates: true,
      }),
    };
  }, []);
  const [frame, setFrame] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const last = demo.result.updates.length - 1;
  const running = playing && frame < last;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setFrame((f) => Math.min(last, f + 1)),
      40
    );
    return () => window.clearInterval(timer);
  }, [running, last]);
  const update = demo.result.updates[frame];
  const cells = update?.state ?? demo.cue;
  const matches = cells.filter((c, i) => c === demo.target[i]).length;
  return (
    <div className="py-7 sm:py-10">
      <section className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">
            MemoryForge / Interactive neural memory
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.045em] text-slate-950 sm:text-5xl">
            A little noise.
            <br />
            <span className="text-blue-600">A network that remembers.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Give a neural network an incomplete pattern. Watch its neurons work
            toward a memory—then learn why they sometimes get it wrong.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="#learn" className="button-primary">
            Start learning ↗
          </a>
          <a href="#lab" className="button-secondary">
            Open the lab
          </a>
        </div>
      </section>
      <section
        aria-label="Interactive recall demonstration"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_-24px_#334155]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon name="lab" />
            </span>
            <h2 className="font-semibold text-slate-900">
              See recall in action
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Live computation · 4 stored memories · Seed 11
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 px-5 py-5 sm:px-7">
          <button
            onClick={() => {
              if (frame >= last) setFrame(-1);
              setPlaying(!running);
            }}
            className="button-primary"
          >
            {running
              ? 'Pause recall'
              : frame >= last
                ? 'Replay recall'
                : 'Watch it recall →'}
          </button>
          <label className="min-w-32 flex-1 text-xs text-slate-500">
            Recorded updates · {frame + 1} / {last + 1}
            <input
              aria-label="Demo recall timeline"
              type="range"
              min="-1"
              max={last}
              value={frame}
              onChange={(e) => {
                setPlaying(false);
                setFrame(Number(e.target.value));
              }}
              className="mt-2 block w-full accent-blue-600"
            />
          </label>
          <p className="max-w-52 text-xs leading-5 text-slate-500">
            Real computed states, not a visual morph. During recall, weights
            stay fixed.
          </p>
        </div>
        <div className="grid items-start lg:grid-cols-[minmax(150px,1fr)_minmax(0,2.4fr)_minmax(150px,1fr)]">
          <div className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              01 / The input
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              A damaged memory
            </h3>
            <div className="my-5 max-w-40">
              <PatternGrid label="Demo damaged cue" cells={demo.cue} readOnly />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              19 of 64 pixels flipped. The network sees only this noisy copy.
            </p>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-medium text-slate-500">
                Original · retained for comparison
              </p>
              <div className="max-w-40">
                <PatternGrid
                  label="Demo original pattern"
                  cells={demo.target}
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="min-w-0 border-y border-slate-100 bg-slate-50/60 p-3 sm:p-5 lg:border-x lg:border-y-0">
            <div className="mb-4 flex items-center justify-between gap-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                02 / Inside the network
              </p>
              <span className="text-xs text-blue-700">
                {running
                  ? 'Recalling'
                  : frame === last
                    ? 'Complete'
                    : 'Ready to explore'}
              </span>
            </div>
            <div className="mx-auto max-w-[520px]">
              <NetworkView
                weights={demo.weights}
                cells={cells}
                selected={update?.neuron ?? 0}
                active={update?.neuron}
              />
            </div>
            <p className="mt-3 px-1 text-xs leading-5 text-slate-500">
              Filled = ON (+1). Outlined = OFF (−1). The amber ring marks the
              neuron being updated.
            </p>
          </div>
          <div className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              03 / The result
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {frame === last ? 'Final state' : 'Current state'}
            </h3>
            <div className="my-5 max-w-40">
              <PatternGrid
                label="Demo current computed state"
                cells={cells as (-1 | 1)[]}
                readOnly
              />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {matches}
              <span className="text-lg font-normal text-slate-400"> / 64</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              pixels match the original
            </p>
            <div className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
              {update
                ? 'Neuron ' +
                  (update.neuron + 1) +
                  ': weighted input ' +
                  update.weightedInput.toFixed(4) +
                  '. State ' +
                  update.previousState +
                  ' → ' +
                  update.newState +
                  '.'
                : 'Each neuron reads the weighted votes of the others to choose its next state.'}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-12">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            One idea. Three ways to explore it.
          </h2>
          <p className="text-sm text-slate-500">
            No neural-network background needed.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              '01',
              'learn',
              'Learn the idea',
              'A guided experiment',
              'Store a memory, damage its cue, and discover why a stable result can still be wrong.',
              'Start learning',
            ],
            [
              '02',
              'lab',
              'Build an experiment',
              'An open workspace',
              'Draw your own patterns. Watch weight learning, then inspect each decision during recall.',
              'Enter the lab',
            ],
            [
              '03',
              'evidence',
              'Check the evidence',
              'Measured results',
              'Compare noise and memory load across fixed seeds. Reproduce successes and failures.',
              'Explore results',
            ],
          ].map(([n, route, title, tag, body, action]) => (
            <a
              key={route}
              href={'#' + route}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 transition-[border-color,box-shadow] duration-150 hover:border-blue-200 hover:shadow-md motion-reduce:transition-none"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-blue-600">
                  <Icon name={route as 'learn' | 'lab' | 'evidence'} />
                  <span className="text-xs text-slate-400">{n}</span>
                </span>
                <span className="text-sm text-slate-400">{tag}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">
                {title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                {body}
              </p>
              <span className="mt-6 text-sm font-semibold text-blue-700">
                {action} ↗
              </span>
            </a>
          ))}
        </div>
      </section>

      <p className="mt-8 text-sm leading-6 text-slate-500">
        A classical Hopfield network—not a chatbot or a biological brain.{' '}
        <a
          href="#research"
          className="font-medium text-blue-700 underline underline-offset-4"
        >
          Read the model’s assumptions and limitations ↗
        </a>
      </p>
    </div>
  );
}
