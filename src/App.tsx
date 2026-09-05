import { useMemo, useReducer, useState } from 'react';
import { PatternGrid, PatternThumbnail } from './components/lab/PatternGrid';
import {
  blankPattern,
  createLabState,
  labReducer,
  PRESETS,
} from './components/lab/patterns';
import type { Cell, PatternCells } from './components/lab/patterns';
import { createWeightMatrix } from './engine/hebbian';
import { recall } from './engine/recall';
import { addNoise } from './experiments/noise';

const panel = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6';
const heading = 'text-base font-semibold tracking-tight text-slate-900';
const help = 'text-sm leading-6 text-slate-500';

function WeightMatrixPreview({ weights }: { weights: number[][] }) {
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
}

function App() {
  const [state, dispatch] = useReducer(labReducer, undefined, createLabState);
  const [noisePercentage, setNoisePercentage] = useState(0);
  const [recalled, setRecalled] = useState<PatternCells | null>(null);
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

  function selectPattern(id: string) {
    dispatch({ type: 'select', id });
    setNoisePercentage(0);
    setRecalled(null);
  }

  function changeNoise(percentage: number) {
    if (!selected) return;
    setNoisePercentage(percentage);
    dispatch({
      type: 'cue',
      cells: addNoise(selected.cells, percentage, `noise-${selected.id}`),
    });
    setRecalled(null);
  }

  function resetExperiment() {
    dispatch({ type: 'restore-cue' });
    setNoisePercentage(0);
    setRecalled(null);
  }

  function runRecall() {
    if (!state.cue || weights.length === 0) return;
    const result = recall(weights, Array.from(state.cue), 'recall', {
      maxSweeps: 100,
    });
    setRecalled(result.finalState.map((cell): Cell => (cell === 1 ? 1 : -1)));
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-slate-50 font-sans text-slate-800 antialiased scheme-light [&_button]:cursor-pointer [&_button]:touch-manipulation [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-blue-600 [&_button:focus-visible]:outline-offset-4">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a
            href="#main"
            className="text-lg font-semibold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-4"
          >
            MemoryForge
          </a>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Pattern editor
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Create a pattern, save it, then edit a separate cue.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]">
          <section className={panel} aria-labelledby="drawing-heading">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="drawing-heading" className={heading}>
                Draw a pattern
              </h2>
              <span className="text-sm tabular-nums text-slate-500">8 × 8</span>
            </div>
            <div className="mx-auto max-w-sm">
              <PatternGrid
                label="Drawing"
                cells={state.draft}
                onChange={(cells) => dispatch({ type: 'draft', cells })}
                resetLabel="Clear drawing"
              />
            </div>

            <div
              className="mt-6 border-t border-slate-100 pt-5"
              aria-labelledby="gallery-heading"
            >
              <h3 id="gallery-heading" className="mb-3 text-sm font-medium">
                Pattern gallery
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="flex flex-col items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-1 py-3 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    aria-label={`Load ${preset.name} into drawing`}
                    onClick={() => dispatch({ type: 'preset', id: preset.id })}
                  >
                    <PatternThumbnail cells={preset.cells} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault();
                dispatch({ type: 'store' });
                setNoisePercentage(0);
                setRecalled(null);
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                value={state.name}
                maxLength={40}
                placeholder="Name your pattern"
                onChange={(event) =>
                  dispatch({ type: 'name', name: event.target.value })
                }
              />
              <button
                className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
                type="submit"
              >
                Store Pattern
              </button>
            </form>
          </section>

          <div className="flex min-w-0 flex-col gap-6">
            <section className={panel} aria-labelledby="library-heading">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 id="library-heading" className={heading}>
                  Stored patterns{' '}
                  <span className="ml-1 text-sm font-normal tabular-nums text-slate-500">
                    ({state.stored.length})
                  </span>
                </h2>
              </div>
              {state.stored.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-4 py-5">
                  <p className="text-sm font-medium text-slate-700">
                    No stored patterns yet
                  </p>
                </div>
              ) : (
                <>
                  <div
                    role="group"
                    aria-label="Stored patterns"
                    className="-m-1 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto p-1 sm:grid-cols-2"
                  >
                    {state.stored.map((pattern, index) => (
                      <button
                        key={pattern.id}
                        type="button"
                        aria-pressed={pattern.id === state.selectedId}
                        aria-label={`Select ${pattern.name}, stored pattern ${index + 1}`}
                        onClick={() => selectPattern(pattern.id)}
                        className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 aria-pressed:border-blue-600 aria-pressed:bg-blue-50"
                      >
                        <PatternThumbnail cells={pattern.cells} />
                        <span className="min-w-0 flex-1">
                          <strong className="block text-sm font-medium wrap-anywhere">
                            {pattern.name}
                          </strong>
                          <span className="mt-1 block text-xs text-slate-500">
                            Pattern {String(index + 1).padStart(2, '0')}
                          </span>
                        </span>
                        <span
                          className="shrink-0 text-blue-700"
                          aria-hidden="true"
                        >
                          {pattern.id === state.selectedId ? '✓' : '○'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Selecting a pattern replaces the cue with a fresh copy.
                  </p>
                </>
              )}
            </section>

            <section className={panel} aria-labelledby="comparison-heading">
              <h2 id="comparison-heading" className={heading}>
                Recall experiment
              </h2>
              {selected && state.cue ? (
                <>
                  <p className="mt-1 text-sm text-slate-500 wrap-anywhere">
                    Recall target:{' '}
                    <strong className="font-medium text-slate-700">
                      {selected.name}
                    </strong>
                  </p>
                  <div className="my-6 flex flex-wrap items-end gap-4 rounded-lg bg-slate-50 p-4">
                    <label className="min-w-56 flex-1 text-sm font-medium text-slate-700">
                      Noise:{' '}
                      <span className="tabular-nums">{noisePercentage}%</span>
                      <input
                        className="mt-2 block w-full accent-blue-600"
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={noisePercentage}
                        onChange={(event) =>
                          changeNoise(Number(event.target.value))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={runRecall}
                      className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Recall
                    </button>
                  </div>
                  <div className="grid gap-7 md:grid-cols-3 md:gap-5">
                    <div className="mx-auto w-full max-w-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold">Original</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Read-only saved pattern
                        </p>
                      </div>
                      <PatternGrid
                        label="Original"
                        cells={selected.cells}
                        readOnly
                      />
                    </div>
                    <div className="mx-auto w-full max-w-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold">Damaged cue</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Editable copy
                        </p>
                      </div>
                      <PatternGrid
                        label="Cue"
                        cells={state.cue}
                        onChange={(cells) => {
                          dispatch({ type: 'cue', cells });
                          setRecalled(null);
                        }}
                        onReset={resetExperiment}
                        resetLabel="Reset"
                      />
                    </div>
                    <div className="mx-auto w-full max-w-sm">
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold">
                          Recalled output
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {recalled
                            ? 'Final network state'
                            : 'Run recall to calculate'}
                        </p>
                      </div>
                      <PatternGrid
                        label={
                          recalled
                            ? 'Recalled output'
                            : 'Recalled output, not run'
                        }
                        cells={recalled ?? blankPattern()}
                        readOnly
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
                  <h3 className="text-sm font-medium text-slate-700">
                    Store a pattern to begin
                  </h3>
                  <p className={`${help} mt-2 max-w-xs`}>
                    Your original and its editable cue will appear side by side
                    here.
                  </p>
                </div>
              )}
            </section>

            <WeightMatrixPreview weights={weights} />
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs leading-5 text-slate-500">
          <span className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-xs bg-slate-800"
              aria-hidden="true"
            />
            On = +1
            <span
              className="ml-3 size-2.5 rounded-xs border border-slate-300 bg-slate-100"
              aria-hidden="true"
            />
            Off = −1
          </span>
        </footer>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {state.announcement}
        </p>
      </main>
    </div>
  );
}

export default App;
