import { useMemo, useState } from 'react';
import { createWeightMatrix } from '../engine/hebbian';
import { recall, type RecallResult } from '../engine/recall';
import {
  buildRecallMetrics,
  generateNoisyCopy,
  generateRandomPatterns,
} from '../experiments';
import { runControlledExperiments } from '../experiments/run-evaluation';
import { PatternGrid } from '../components/lab/PatternGrid';
import { StorageView } from '../components/lab/StorageView';
import { NeuronInspector } from '../components/lab/NeuronInspector';
import type {
  LabScenario,
  PatternCells,
  StoredPattern,
} from '../components/lab/patterns';

const lessons = [
  {
    title: 'Store a memory',
    question: 'Where does a network keep a picture?',
    body: 'Every pixel becomes one neuron: ON is +1 and OFF is −1. To store a pattern, we add an association between every pair of pixels. These associations share one weight matrix.',
    action: 'Store four patterns',
    note: 'Wᵢⱼ = (1/64) Σₚ ξᵢᵖ ξⱼᵖ, with Wᵢᵢ = 0. Equal signs contribute positively; opposite signs contribute negatively.',
  },
  {
    title: 'Damage the cue',
    question: 'What if some of the pixels are wrong?',
    body: 'The original is only our reference. The network receives a separate, damaged copy called a cue. It will not get to look at the correct answer during recall.',
    action: 'Flip 20% of the pixels',
    note: '20% of 64 rounds to 13 distinct pixels. A fixed seed makes this damage reproducible.',
  },
  {
    title: 'Let neurons decide',
    question: 'Can the connections reconstruct the memory?',
    body: 'One neuron at a time reads a weighted sum of the current states. It becomes +1 for a positive sum, −1 for a negative sum, and keeps its old value on a tie.',
    action: 'Run actual recall',
    note: 'A sweep updates every neuron once. Recall stops only after a sweep makes no changes, or the sweep limit is reached.',
  },
  {
    title: 'Make memories compete',
    question: 'Does more storage always mean more memory?',
    body: 'Keep the target, noisy cue, and update-order seed unchanged. Add twelve competing patterns to the same connections, then repeat recall. This selected case was found using the real experiment engine.',
    action: 'Add 12 memories and recall',
    note: 'This is a controlled comparison: only the stored memory bank changes. Failure here does not mean every 16-pattern network fails.',
  },
  {
    title: 'Read the result',
    question: 'Does a stable state mean the right answer?',
    body: 'No. Convergence means the neurons stopped changing. Exact recall means all 64 cells match the intended target. A stable but wrong output separates these two ideas.',
    action: 'Finish the lesson',
    note: 'The lesson: associations are distributed across shared connections. That supports recall from a cue, but also creates interference.',
  },
];
export function GuidedLesson({
  onOpenLab,
}: {
  onOpenLab: (scenario: LabScenario) => void;
}) {
  const preset = useMemo(() => {
    const run = runControlledExperiments().memoryLoad.find(
      (r) => r.patternCount === 16 && !r.metrics.exactRecall
    );
    if (!run) throw new Error('No measured interference example was found.');
    const patterns = generateRandomPatterns(run.seed, 16);
    const target = patterns.find((p) => p.id === run.targetPatternId)!;
    return {
      run,
      patterns,
      target,
      cue: generateNoisyCopy(target.cells, 20, run.seed + 1000).cells,
    };
  }, []);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(-1);
  const [stored, setStored] = useState<readonly StoredPattern[]>([]);
  const [cue, setCue] = useState<PatternCells>(preset.target.cells);
  const [result, setResult] = useState<RecallResult | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const weights = useMemo(
    () => createWeightMatrix(stored.map((p) => [...p.cells])),
    [stored]
  );
  const metrics = result
    ? buildRecallMetrics(
        result.finalState,
        preset.target,
        stored,
        result,
        50,
        0
      )
    : null;
  const lesson = lessons[step];
  function act() {
    const bank = preset.patterns.slice(0, step >= 3 ? 16 : 4);
    setStored(bank);
    setCue(step === 0 ? preset.target.cells : preset.cue);
    setResult(
      step >= 2
        ? recall(
            createWeightMatrix(bank.map((p) => [...p.cells])),
            [...preset.cue],
            preset.run.seed + 2000,
            { maxSweeps: 50, captureUpdates: true }
          )
        : null
    );
    setRunId((id) => id + 1);
    setCompleted(step);
  }
  function restart() {
    setStep(0);
    setCompleted(-1);
    setStored([]);
    setCue(preset.target.cells);
    setResult(null);
    setAnswer(null);
  }
  return (
    <div className="py-10">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Learn by doing</p>
          <h1 className="page-title mt-2">Learn associative memory.</h1>
          <p className="mt-3 text-slate-500">
            Five short steps, with the same experiment carried through each one.
          </p>
        </div>
        <button
          onClick={restart}
          className="text-sm text-slate-600 underline underline-offset-4"
        >
          Restart lesson
        </button>
      </div>
      <div
        className="mb-7 h-1.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Lesson completion"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={completed + 1}
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: ((completed + 1) / 5) * 100 + '%' }}
        />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="surface-panel p-3 lg:p-4">
          <p className="mb-4 hidden text-xs uppercase tracking-widest text-slate-500 lg:block">
            Your learning path
          </p>
          <ol className="grid grid-cols-5 gap-2 lg:block lg:space-y-2">
            {lessons.map((item, i) => (
              <li key={item.title}>
                <button
                  disabled={i > completed + 1}
                  onClick={() => {
                    setStep(i);
                    document
                      .getElementById('lesson-step')
                      ?.scrollIntoView?.({ block: 'start' });
                  }}
                  aria-current={step === i ? 'step' : undefined}
                  className={`flex min-h-11 w-full items-center justify-center gap-3 rounded-lg p-2 text-left text-sm lg:justify-start lg:p-3 disabled:opacity-40 ${step === i ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="font-mono text-xs">
                    {completed >= i ? '✓' : `0${i + 1}`}
                  </span>
                  <span className="sr-only lg:not-sr-only">{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-5 hidden border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 lg:block">
            Same engine as the playground.
            <br />
            Seed {preset.run.seed} · target {preset.target.name}
          </p>
        </aside>
        <section
          id="lesson-step"
          className="surface-panel scroll-mt-24 p-6 sm:p-8"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-blue-700">
            Step {step + 1} / 5
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {lesson.question}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {lesson.body}
          </p>
          <div className="mt-6 rounded-lg border-l-2 border-teal-600 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {lesson.note}
          </div>
          {step === 4 && (
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-medium">
                Check your understanding: the network stopped changing. What can
                we conclude?
              </legend>
              {[
                'It must have recovered the target.',
                'It is stable; accuracy still needs to be checked.',
              ].map((choice) => (
                <label
                  key={choice}
                  className="mb-2 flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="understanding"
                    checked={answer === choice}
                    onChange={() => setAnswer(choice)}
                  />
                  {choice}
                </label>
              ))}
              {answer && (
                <p role="status" className="mt-3 text-sm text-teal-800">
                  {answer.startsWith('It is stable')
                    ? 'Exactly. Convergence and correctness are separate measurements.'
                    : 'Not necessarily. A stable state can be a different memory or an unstored state.'}
                </p>
              )}
            </fieldset>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={act}
              disabled={step === 4 && !answer?.startsWith('It is stable')}
              className="button-primary"
            >
              {lesson.action}
            </button>
            {completed >= step && step < 4 && (
              <button
                onClick={() => {
                  setStep(step + 1);
                  document
                    .getElementById('lesson-step')
                    ?.scrollIntoView?.({ block: 'start' });
                }}
                className="button-secondary"
              >
                Continue →
              </button>
            )}
            {completed === 4 && (
              <button
                onClick={() =>
                  onOpenLab({
                    stored,
                    selectedId: preset.target.id,
                    cue,
                    label: 'Completed guided interference experiment',
                    recallSeed: preset.run.seed + 2000,
                    noiseSeed: preset.run.seed + 1000,
                    maxSweeps: 50,
                  })
                }
                className="rounded-lg border border-teal-300 px-5 py-3 text-sm font-semibold text-teal-800"
              >
                Continue in the playground ↗
              </button>
            )}
          </div>
          <p className="mt-4 text-sm text-slate-500" role="status">
            {stored.length === 0
              ? 'Start by storing the patterns.'
              : `${stored.length} patterns stored · ${cue.filter((c, i) => c !== preset.target.cells[i]).length} pixels changed${metrics ? ` · exact recall: ${metrics.exactRecall ? 'yes' : 'no'} · converged: ${metrics.converged ? 'yes' : 'no'}` : ''}`}
          </p>
        </section>
      </div>
      {stored.length > 0 && !result && (
        <div className="mt-8">
          <StorageView key={runId} patterns={stored} />
        </div>
      )}
      {stored.length > 0 && (
        <section className="mt-8 grid gap-8 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-3">
          {[
            ['Original reference', preset.target.cells],
            ['Cue sent to the network', cue],
            ['Computed output', result?.finalState],
          ].map(([label, cells]) => (
            <div key={label as string} className="mx-auto w-full max-w-60">
              <h3 className="mb-4 text-sm font-semibold">{label as string}</h3>
              {cells ? (
                <PatternGrid
                  label={label as string}
                  cells={cells as PatternCells}
                  readOnly
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">
                  Run recall in step 3
                </div>
              )}
            </div>
          ))}
        </section>
      )}
      {result && (
        <div className="mt-8">
          <NeuronInspector
            key={runId}
            weights={weights}
            result={result}
            autoPlay
            cue={cue}
            stored={stored}
          />
        </div>
      )}
    </div>
  );
}
