import { memo, useMemo, useReducer, useState } from 'react';
import { PatternGrid, PatternThumbnail } from '../components/lab/PatternGrid';
import {
  blankPattern,
  createLabState,
  labReducer,
  PRESETS,
} from '../components/lab/patterns';
import type { PatternCells, LabScenario } from '../components/lab/patterns';
import { createWeightMatrix } from '../engine/hebbian';
import { recall, type RecallResult } from '../engine/recall';
import { Icon } from '../components/Icon';
import { StorageView } from '../components/lab/StorageView';
import { NeuronInspector } from '../components/lab/NeuronInspector';
import { generateNoisyCopy } from '../experiments';

import { FailureAnalysis } from '../components/lab/FailureAnalysis';
import { ExperimentDashboard } from './ExperimentDashboard';
import { downloadJson } from '../../utils/download/download';
import { buildRecallMetrics } from '../experiments/evaluation';

const NOISE_PRESETS = [10, 20, 30, 40, 50];

const panel =
  'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_15px_-12px_#26334a]';
const heading = 'text-base font-semibold tracking-tight text-slate-900';

const WeightMatrixPreview = memo(function WeightMatrixPreview({
  weights,
}: {
  weights: number[][];
}) {
  return (
    <section className={panel} aria-labelledby="weights-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="weights-heading" className={heading}>
            Weight matrix
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            64 × 64 Hebbian connection weights
          </p>
        </div>
        <span className="text-xs tabular-nums text-slate-500">
          {weights.length === 0 ? 'No weights' : '4,096 values'}
        </span>
      </div>
      {weights.length === 0 ? (
        <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
          Store a pattern to calculate the weights.
        </div>
      ) : (
        <div
          className="max-h-80 overflow-auto rounded-lg border border-slate-200"
          tabIndex={0}
          aria-label="Scrollable 64 by 64 weight matrix"
        >
          <table className="border-separate border-spacing-0 font-mono text-[11px] tabular-nums text-slate-600">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 border-r border-b border-slate-200 bg-slate-100 px-2 py-1.5 text-slate-500">
                  i\j
                </th>
                {weights.map((_, column) => (
                  <th
                    key={column}
                    scope="col"
                    className="sticky top-0 z-10 min-w-14 border-b border-slate-200 bg-slate-100 px-2 py-1.5 font-medium text-slate-500"
                  >
                    {column + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weights.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th
                    scope="row"
                    className="sticky left-0 border-r border-b border-slate-200 bg-slate-100 px-2 py-1.5 font-medium text-slate-500"
                  >
                    {rowIndex + 1}
                  </th>
                  {row.map((weight, columnIndex) => (
                    <td
                      key={columnIndex}
                      className={`border-r border-b border-slate-100 px-2 py-1.5 text-right ${rowIndex === columnIndex ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}
                    >
                      {weight.toFixed(3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
});

function Lab({
  embedded = false,
  active = true,
  initialScenario,
}: {
  embedded?: boolean;
  active?: boolean;
  initialScenario?: LabScenario;
} = {}) {
  const [state, dispatch] = useReducer(
    labReducer,
    initialScenario,
    (scenario) =>
      scenario
        ? labReducer(createLabState(), { type: 'load-scenario', ...scenario })
        : createLabState()
  );
  const [editorMode, setEditorMode] = useState<'create' | 'cue'>(
    initialScenario ? 'cue' : 'create'
  );
  const [animateStorage, setAnimateStorage] = useState(false);
  const [networkTab, setNetworkTab] = useState<'storage' | 'recall'>('storage');
  const [inspection, setInspection] = useState<RecallResult | null>(null);
  const [tab, setTab] = useState<'lab' | 'dashboard'>('lab');
  const [noisePercentage, setNoisePercentage] = useState(() => {
    const target = initialScenario?.stored.find(
      (p) => p.id === initialScenario.selectedId
    );
    return initialScenario && target
      ? Math.round(
          (initialScenario.cue.filter((c, i) => c !== target.cells[i]).length /
            64) *
            100
        )
      : 0;
  });
  const [playbackFrame, setPlaybackFrame] = useState(-1);
  const selected = state.stored.find(
    (pattern) => pattern.id === state.selectedId
  );
  const weights = useMemo(
    () =>
      state.stored.length === 0
        ? []
        : createWeightMatrix(
            state.stored.map((pattern) => Array.from(pattern.cells))
          ),
    [state.stored]
  );

  const displayedRecall = inspection
    ? ((inspection.updates[playbackFrame]?.state ?? state.cue) as PatternCells)
    : null;
  function clearPlayback() {
    setAnimateStorage(false);
    setInspection(null);
    setNetworkTab('storage');
    setPlaybackFrame(-1);
  }

  function selectPattern(id: string) {
    setEditorMode('cue');
    dispatch({ type: 'select', id });
    setNoisePercentage(0);
    clearPlayback();
  }

  function resetExperiment() {
    dispatch({ type: 'restore-cue' });
    setNoisePercentage(0);
    clearPlayback();
  }

  function LablyNoise(percentage: number) {
    if (!selected) return;
    const noisyCopy = generateNoisyCopy(
      selected.cells,
      percentage,
      state.noiseSeed
    );
    setNoisePercentage(percentage);
    dispatch({ type: 'cue', cells: noisyCopy.cells });
    clearPlayback();
  }

  // --------------------------------------------------
  // HOPFIELD RECALL
  // --------------------------------------------------

  function revealNetwork() {
    document.getElementById('network-stage')?.scrollIntoView?.({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
  }
  const handleRecall = () => {
    if (!selected || !state.cue) {
      return;
    }

    // Run recall on the current cue.
    const startTime = performance.now();

    const result = recall(weights, [...state.cue], state.recallSeed, {
      maxSweeps: state.maxSweeps,
      captureUpdates: true,
    });
    setInspection(result);
    setNetworkTab('recall');

    const recallTimeMs = performance.now() - startTime;

    // Calculate recall metrics.
    const metrics = buildRecallMetrics(
      result.finalState,
      selected,
      state.stored,
      result,
      state.maxSweeps,
      recallTimeMs
    );

    // Send result to reducer.
    dispatch({
      type: 'recall-result',
      recalled: result.finalState as (-1 | 1)[],
      recallMetrics: metrics,
      snapshots: result.snapshots as (-1 | 1)[][],
    });

    setPlaybackFrame(-1);
    revealNetwork();
  };

  function handleLoadScenario(scenario: LabScenario) {
    dispatch({
      type: 'load-scenario',
      ...scenario,
    });
    const target = scenario.stored.find(
      (pattern) => pattern.id === scenario.selectedId
    );
    setNoisePercentage(
      target
        ? Math.round(
            (scenario.cue.filter((cell, index) => cell !== target.cells[index])
              .length /
              scenario.cue.length) *
              100
          )
        : 0
    );
    clearPlayback();
    setTab('lab');
    setEditorMode('cue');
  }

  function handleExportSession() {
    if (!selected || !state.cue) return;

    downloadJson('memoryforge-session.json', {
      generatedAt: new Date().toISOString(),
      scenarioLabel: state.scenarioLabel,
      recallSeed: state.recallSeed,
      maxSweeps: state.maxSweeps,
      noiseSeed: state.noiseSeed,
      storedPatterns: state.stored,
      target: selected,
      cue: state.cue,
      recalled: state.recalled,
      recallMetrics: state.recallMetrics,
      snapshots: state.snapshots,
    });
  }

  return (
    <div className="min-w-0 py-7 text-slate-800 sm:py-9">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title mt-2">Memory lab</h1>
          <p className="mt-2 text-base text-slate-500">
            Create a memory. Damage its cue. Watch the network respond.
          </p>
        </div>
        <a href="#learn" className="button-secondary">
          <Icon name="learn" />
          Take the guided lesson
        </a>
      </header>
      {!embedded && (
        <div className="mb-5 flex gap-2">
          <button className="button-secondary" onClick={() => setTab('lab')}>
            Pattern Lab
          </button>
          <button
            className="button-secondary"
            onClick={() => setTab('dashboard')}
          >
            Experiment Dashboard
          </button>
        </div>
      )}
      {tab === 'dashboard' ? (
        <ExperimentDashboard onLoadScenario={handleLoadScenario} />
      ) : (
        <>
          <div
            className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-4 text-sm"
            aria-label="Experiment workflow"
          >
            <span className="font-medium text-slate-800">
              <span className="mr-2 text-blue-600">01</span>Create & store
            </span>
            <Icon name="arrow" className="size-3.5 text-slate-300" />
            <span
              className={
                selected ? 'font-medium text-slate-800' : 'text-slate-400'
              }
            >
              <span className="mr-2">02</span>Damage cue
            </span>
            <Icon name="arrow" className="size-3.5 text-slate-300" />
            <span
              className={
                inspection ? 'font-medium text-slate-800' : 'text-slate-400'
              }
            >
              <span className="mr-2">03</span>Recall & inspect
            </span>
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[272px_minmax(0,1fr)] 2xl:grid-cols-[304px_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-4">
              <section
                id="pattern-editor"
                className="surface-panel scroll-mt-24 p-4 sm:p-5"
                aria-label="Pattern editor"
              >
                <div
                  className="mb-5 flex rounded-lg bg-slate-100/80 p-1"
                  role="group"
                  aria-label="Editor mode"
                >
                  <button
                    aria-pressed={editorMode === 'create'}
                    onClick={() => setEditorMode('create')}
                    className="segment-button"
                  >
                    <Icon name="plus" />
                    Create
                  </button>
                  <button
                    aria-pressed={editorMode === 'cue'}
                    disabled={!selected}
                    onClick={() => setEditorMode('cue')}
                    className="segment-button"
                  >
                    Edit cue
                  </button>
                </div>
                {editorMode === 'create' ? (
                  <>
                    <h2 className="section-title">Draw a pattern</h2>
                    <PatternGrid
                      label="Drawing"
                      cells={state.draft}
                      onChange={(cells) => dispatch({ type: 'draft', cells })}
                      resetLabel="Clear drawing"
                    />
                    <div
                      className="mt-4 grid grid-cols-4 gap-1.5"
                      aria-label="Pattern gallery"
                    >
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          aria-label={'Load ' + p.name + ' into drawing'}
                          onClick={() => dispatch({ type: 'preset', id: p.id })}
                          className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 px-1 py-2.5 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50"
                        >
                          <PatternThumbnail cells={p.cells} />
                          {p.name}
                        </button>
                      ))}
                    </div>
                    <form
                      className="mt-5 border-t border-slate-100 pt-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        dispatch({ type: 'store' });
                        setNoisePercentage(0);
                        clearPlayback();
                        setAnimateStorage(true);
                        setEditorMode('cue');
                        revealNetwork();
                      }}
                    >
                      <label
                        htmlFor="pattern-name"
                        className="mb-2 block text-sm font-medium"
                      >
                        Pattern name
                      </label>
                      <input
                        id="pattern-name"
                        value={state.name}
                        maxLength={40}
                        onChange={(event) =>
                          dispatch({ type: 'name', name: event.target.value })
                        }
                        className="field-input w-full"
                        placeholder="Name your pattern"
                      />
                      <button
                        type="submit"
                        className="button-primary mt-3 w-full"
                      >
                        Store Pattern
                        <Icon name="arrow" />
                      </button>
                    </form>
                  </>
                ) : (
                  selected &&
                  state.cue && (
                    <>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <h2 className="section-title truncate">
                          {selected.name}
                        </h2>
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          Cue
                        </span>
                      </div>
                      <p className="mb-4 text-sm leading-6 text-slate-500">
                        Edit this copy. Your original stays unchanged.
                      </p>
                      <PatternGrid
                        label="Damaged cue"
                        cells={state.cue}
                        onChange={(cells) => {
                          dispatch({ type: 'cue', cells });
                          setNoisePercentage(
                            Math.round(
                              (cells.filter((c, i) => c !== selected.cells[i])
                                .length /
                                64) *
                                100
                            )
                          );
                          clearPlayback();
                        }}
                        onReset={resetExperiment}
                        resetLabel="Reset cue"
                      />
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <label
                          className="flex items-center justify-between text-sm font-medium"
                          htmlFor="cue-noise"
                        >
                          Noise
                          <span className="font-mono text-blue-700">
                            {noisePercentage}%
                          </span>
                        </label>
                        <input
                          id="cue-noise"
                          aria-label="Network stage noise"
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={noisePercentage}
                          onChange={(event) =>
                            LablyNoise(Number(event.target.value))
                          }
                          className="my-3 w-full accent-blue-600"
                        />
                        <div className="flex flex-wrap gap-1">
                          {NOISE_PRESETS.map((value) => (
                            <button
                              key={value}
                              onClick={() => LablyNoise(value)}
                              className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              {value}%
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          {
                            state.cue.filter((c, i) => c !== selected.cells[i])
                              .length
                          }{' '}
                          of 64 pixels changed | seed {state.noiseSeed}
                        </p>
                      </div>
                    </>
                  )
                )}
              </section>
              <section
                className="surface-panel p-4"
                aria-label="Stored patterns"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="section-title">Memory bank</h2>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                    {state.stored.length}
                  </span>
                </div>
                {state.stored.length === 0 ? (
                  <p className="py-2 text-sm leading-6 text-slate-500">
                    Stored patterns will Labear here. Start with one memory.
                  </p>
                ) : (
                  <div className="max-h-64 space-y-1.5 overflow-y-auto">
                    {state.stored.map((p, i) => (
                      <button
                        key={p.id}
                        aria-pressed={p.id === state.selectedId}
                        aria-label={
                          'Select ' + p.name + ', stored pattern ' + (i + 1)
                        }
                        onClick={() => selectPattern(p.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left hover:bg-slate-50 aria-pressed:border-blue-200 aria-pressed:bg-blue-50/70"
                      >
                        <PatternThumbnail cells={p.cells} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {p.name}
                        </span>
                        <span className="text-xs text-blue-600">
                          {p.id === state.selectedId ? 'Selected' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selected && (
                  <button
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-700"
                    onClick={() => {
                      setEditorMode('create');
                      document
                        .getElementById('pattern-editor')
                        ?.scrollIntoView?.({ block: 'start' });
                    }}
                  >
                    <Icon name="plus" />
                    Add another memory
                  </button>
                )}
              </section>
            </aside>
            <div className="min-w-0 space-y-5">
              <section
                id="network-stage"
                className="scroll-mt-24"
                aria-label="Network experiment"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="flex gap-1 rounded-lg border border-slate-200 bg-white/70 p-1 backdrop-blur-sm"
                    role="group"
                    aria-label="Network phase"
                  >
                    <button
                      aria-pressed={networkTab === 'storage'}
                      onClick={() => setNetworkTab('storage')}
                      className="segment-button"
                    >
                      Weight learning
                    </button>
                    <button
                      aria-pressed={networkTab === 'recall'}
                      disabled={!inspection}
                      onClick={() => setNetworkTab('recall')}
                      className="segment-button"
                    >
                      Recall playback
                    </button>
                  </div>
                  <button
                    disabled={!selected || !state.cue}
                    onClick={handleRecall}
                    className="button-primary"
                    aria-label="Run recall ↗"
                  >
                    Run recall
                    <Icon name="arrow" />
                  </button>
                </div>
                {networkTab === 'storage' ? (
                  <StorageView
                    key={state.stored.map((p) => p.id).join(',')}
                    patterns={state.stored}
                    autoPlay={animateStorage}
                    active={active}
                  />
                ) : (
                  inspection &&
                  state.cue && (
                    <NeuronInspector
                      key={state.recallVersion}
                      result={inspection}
                      frame={playbackFrame}
                      onFrameChange={setPlaybackFrame}
                      autoPlay
                      weights={weights}
                      cue={state.cue}
                      stored={state.stored}
                      active={active}
                    />
                  )
                )}
              </section>
              {selected && state.cue && (
                <section
                  className="surface-panel p-5"
                  aria-labelledby="comparison-heading"
                >
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="comparison-heading" className="section-title">
                      Compare the states
                    </h2>
                    <span className="text-xs text-slate-500">
                      Network and output share the same timeline
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    {[
                      [
                        'Original',
                        selected.cells,
                        'Kept for evaluation only',
                        'Original',
                      ],
                      [
                        'Damaged cue',
                        state.cue,
                        'The input sent to the network',
                        'Input cue reference',
                      ],
                      [
                        'Recalled output',
                        displayedRecall ?? blankPattern(),
                        displayedRecall
                          ? playbackFrame < 0
                            ? 'Recorded input cue'
                            : 'Recorded neuron update ' + (playbackFrame + 1)
                          : 'Run recall to calculate',
                        displayedRecall
                          ? playbackFrame < 0
                            ? 'Recall input cue'
                            : 'Recalled output at update ' + (playbackFrame + 1)
                          : 'Recalled output, not run',
                      ],
                    ].map(([title, cells, note, label]) => (
                      <div
                        key={String(title)}
                        className="mx-auto w-full max-w-52"
                      >
                        <h3 className="mb-3 text-sm font-semibold">
                          {String(title)}
                        </h3>
                        <PatternGrid
                          label={String(label)}
                          cells={cells as PatternCells}
                          readOnly
                        />
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {String(note)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {state.recallMetrics && selected && (
                <section
                  className="surface-panel p-5"
                  aria-label="Recall evaluation"
                >
                  <div className="mb-4 flex flex-wrap justify-between gap-3">
                    <h2 className="section-title">
                      What did the network remember?
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 divide-slate-100 sm:grid-cols-4">
                    {[
                      [
                        'Exact recall',
                        state.recallMetrics.exactRecall ? 'Yes' : 'No',
                      ],
                      [
                        'Pixel accuracy',
                        (state.recallMetrics.cellAccuracy * 100).toFixed(1) +
                          '%',
                      ],
                      [
                        'Converged',
                        state.recallMetrics.converged ? 'Yes' : 'No',
                      ],
                      ['Sweeps', String(state.recallMetrics.sweeps)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg bg-slate-50 px-4 py-3"
                      >
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-800">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <FailureAnalysis
                    metrics={state.recallMetrics}
                    targetPatternId={selected.id}
                    targetName={selected.name}
                  />
                  <p className="mt-3 text-xs text-slate-500">
                    {state.recallMetrics.matchingCells}/
                    {state.recallMetrics.totalCells} cells match · computation{' '}
                    {state.recallMetrics.recallTimeMs.toFixed(3)} ms
                  </p>
                </section>
              )}
              <details className="surface-panel">
                <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-600">
                  Technical details & export
                </summary>
                <div className="space-y-4 border-t border-slate-100 p-4">
                  <p className="text-sm text-slate-500">
                    Recall seed {state.recallSeed} · noise seed{' '}
                    {state.noiseSeed} · maximum {state.maxSweeps} sweeps
                    {state.scenarioLabel ? ' · ' + state.scenarioLabel : ''}
                  </p>
                  <WeightMatrixPreview weights={weights} />
                  <button
                    className="button-secondary"
                    onClick={handleExportSession}
                    disabled={!selected}
                  >
                    Export session (JSON)
                  </button>
                </div>
              </details>
            </div>
          </div>
        </>
      )}
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.announcement}
      </p>
    </div>
  );
}
export default Lab;
