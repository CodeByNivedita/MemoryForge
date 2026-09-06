import { useReducer, useState } from "react";
import {
  PatternGrid,
  PatternThumbnail,
} from "./components/lab/PatternGrid";
import {
  createLabState,
  labReducer,
  PRESETS,
} from "./components/lab/patterns";
import type { PatternCells, StoredPattern } from "./components/lab/patterns";
import { SnapshotPlayer } from "./components/lab/Snapshotplayer.tsx";
import { FailureAnalysis } from "./components/lab/FailureAnalysis";
import { ExperimentDashboard } from "./components/lab/ExperimentDashboard";
import { downloadJson } from "../utils/download/download";




import { createWeightMatrix } from "./engine/hebbian";
import { recall } from "./engine/recall";
import { buildRecallMetrics } from "./experiments/evaluation";

const NOISE_PRESETS = [10, 20, 30, 40, 50];

const panel =
  "rounded-xl border border-slate-200 bg-white p-5 sm:p-6";

const heading =
  "text-base font-semibold tracking-tight text-slate-900";

const help =
  "text-sm leading-6 text-slate-500";

function App() {
  const [state, dispatch] = useReducer(
    labReducer,
    undefined,
    createLabState,
  );

  const [tab, setTab] = useState<"lab" | "dashboard">("lab");

  const selected = state.stored.find(
    (pattern) => pattern.id === state.selectedId,
  );

  // --------------------------------------------------
  // HOPFIELD RECALL
  // --------------------------------------------------

  const handleRecall = () => {
    if (!selected || !state.cue) {
      return;
    }

    // Train the Hopfield network using all stored memories.
    const weights = createWeightMatrix(
      state.stored.map((pattern) => [...pattern.cells]),
    );

    // Run recall on the current cue.
    const startTime = performance.now();

    const result = recall(
      weights,
      [...state.cue],
      42,
    );

    const recallTimeMs =
      performance.now() - startTime;

    // Calculate recall metrics.
    const metrics = buildRecallMetrics(
      result.finalState,
      selected,
      state.stored,
      result,
      100,
      recallTimeMs,
    );

    // Send result to reducer.
    dispatch({
      type: "recall-result",
      recalled: result.finalState as (-1 | 1)[],
      recallMetrics: metrics,
      snapshots: result.snapshots as (-1 | 1)[][],
    });
  };

  function handleLoadScenario(scenario: {
    stored: readonly StoredPattern[];
    selectedId: string;
    cue: PatternCells;
    label: string;
  }) {
    dispatch({
      type: "load-scenario",
      stored: scenario.stored,
      selectedId: scenario.selectedId,
      cue: scenario.cue,
      label: scenario.label,
    });
    setTab("lab");
  }

  function handleExportSession() {
    if (!selected || !state.cue) return;

    downloadJson("memoryforge-session.json", {
      generatedAt: new Date().toISOString(),
      scenarioLabel: state.scenarioLabel,
      storedPatterns: state.stored,
      target: selected,
      cue: state.cue,
      recalled: state.recalled,
      recallMetrics: state.recallMetrics,
      snapshots: state.snapshots,
    });
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-slate-50 font-sans text-slate-800 antialiased scheme-light [&_button]:cursor-pointer [&_button]:touch-manipulation [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-blue-600 [&_button:focus-visible]:outline-offset-4">

      {/* HEADER */}
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


      {/* MAIN */}
      <main
        id="main"
        className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
      >

        {/* TITLE */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {tab === "lab" ? "Pattern editor" : "Experiment dashboard"}
            </h1>

            <p className="mt-2 text-base leading-7 text-slate-600">
              {tab === "lab"
                ? "Create a pattern, save it, then edit a separate cue."
                : "Aggregate results from controlled noise and memory-load experiments."}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="View"
            className="flex shrink-0 gap-1 rounded-lg border border-slate-200 bg-white p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "lab"}
              onClick={() => setTab("lab")}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 aria-selected:bg-slate-900 aria-selected:text-white hover:not-aria-selected:bg-slate-50"
            >
              Pattern Lab
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "dashboard"}
              onClick={() => setTab("dashboard")}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 aria-selected:bg-slate-900 aria-selected:text-white hover:not-aria-selected:bg-slate-50"
            >
              Experiment Dashboard
            </button>
          </div>
        </div>

        {tab === "dashboard" && (
          <ExperimentDashboard onLoadScenario={handleLoadScenario} />
        )}

        {/* MAIN TWO-COLUMN LAYOUT */}
        {tab === "lab" && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]">

          {/* =========================================
              LEFT PANEL
              ========================================= */}

          <section
            className={panel}
            aria-labelledby="drawing-heading"
          >

            {/* DRAWING */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2
                id="drawing-heading"
                className={heading}
              >
                Draw a pattern
              </h2>

              <span className="text-sm tabular-nums text-slate-500">
                8 × 8
              </span>
            </div>


            <div className="mx-auto max-w-sm">
              <PatternGrid
                label="Drawing"
                cells={state.draft}
                onChange={(cells) =>
                  dispatch({
                    type: "draft",
                    cells,
                  })
                }
                resetLabel="Clear drawing"
              />
            </div>


            {/* PATTERN GALLERY */}
            <div
              className="mt-6 border-t border-slate-100 pt-5"
              aria-labelledby="gallery-heading"
            >

              <h3
                id="gallery-heading"
                className="mb-3 text-sm font-medium"
              >
                Pattern gallery
              </h3>

              <div className="grid grid-cols-4 gap-2">

                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="flex flex-col items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-1 py-3 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    aria-label={`Load ${preset.name} into drawing`}
                    onClick={() =>
                      dispatch({
                        type: "preset",
                        id: preset.id,
                      })
                    }
                  >
                    <PatternThumbnail
                      cells={preset.cells}
                    />

                    <span>
                      {preset.name}
                    </span>
                  </button>
                ))}

              </div>
            </div>


            {/* STORE PATTERN */}
            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault();

                dispatch({
                  type: "store",
                });
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
                  dispatch({
                    type: "name",
                    name: event.target.value,
                  })
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


          {/* =========================================
              RIGHT SIDE
              ========================================= */}

          <div className="flex min-w-0 flex-col gap-6">


            {/* =========================================
                STORED PATTERNS
                ========================================= */}

            <section
              className={panel}
              aria-labelledby="library-heading"
            >

              <div className="mb-4 flex items-baseline justify-between gap-3">

                <h2
                  id="library-heading"
                  className={heading}
                >
                  Stored patterns{" "}

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

                    {state.stored.map(
                      (pattern, index) => (
                        <button
                          key={pattern.id}
                          type="button"
                          aria-pressed={
                            pattern.id ===
                            state.selectedId
                          }
                          aria-label={`Select ${pattern.name}, stored pattern ${index + 1}`}
                          onClick={() =>
                            dispatch({
                              type: "select",
                              id: pattern.id,
                            })
                          }
                          className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 aria-pressed:border-blue-600 aria-pressed:bg-blue-50"
                        >

                          <PatternThumbnail
                            cells={pattern.cells}
                          />

                          <span className="min-w-0 flex-1">

                            <strong className="block text-sm font-medium wrap-anywhere">
                              {pattern.name}
                            </strong>

                            <span className="mt-1 block text-xs text-slate-500">
                              Pattern{" "}
                              {String(
                                index + 1,
                              ).padStart(2, "0")}
                            </span>

                          </span>

                          <span
                            className="shrink-0 text-blue-700"
                            aria-hidden="true"
                          >
                            {pattern.id ===
                            state.selectedId
                              ? "✓"
                              : "○"}
                          </span>

                        </button>
                      ),
                    )}

                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Selecting a pattern replaces the cue
                    with a fresh copy.
                  </p>

                </>

              )}

            </section>


            {/* =========================================
                RECALL / COMPARISON
                ========================================= */}

            <section
              className={panel}
              aria-labelledby="comparison-heading"
            >

              {selected && state.cue ? (

                <>

                  {/* SCENARIO BANNER */}
                  {state.scenarioLabel && (
                    <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                      Loaded preset: {state.scenarioLabel}
                    </div>
                  )}

                  {/* TARGET NAME */}
                  <p className="mt-1 mb-6 text-sm text-slate-500 wrap-anywhere">

                    Recall target:{" "}

                    <strong className="font-medium text-slate-700">
                      {selected.name}
                    </strong>

                  </p>


                  {/* =================================
                      THREE PATTERN GRIDS
                      ================================= */}

                  <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">


                    {/* ORIGINAL */}
                    <div className="mx-auto w-full max-w-sm">

                      <div className="mb-3">

                        <h3 className="text-sm font-semibold">
                          Original
                        </h3>

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


                    {/* CUE */}
                    <div className="mx-auto w-full max-w-sm">

                      <div className="mb-3">

                        <h3 className="text-sm font-semibold">
                          Cue
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Editable copy
                        </p>

                      </div>

                      <PatternGrid
                        label="Cue"
                        cells={state.cue}
                        onChange={(cells) =>
                          dispatch({
                            type: "cue",
                            cells,
                          })
                        }
                        onReset={() =>
                          dispatch({
                            type: "restore-cue",
                          })
                        }
                        resetLabel="Restore cue"
                      />

                      {/* NOISE CONTROLS */}
                      <div className="mt-3">
                        <p className="mb-1.5 text-xs text-slate-500">
                          Add noise to cue
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {NOISE_PRESETS.map((percent) => (
                            <button
                              key={percent}
                              type="button"
                              onClick={() =>
                                dispatch({ type: "add-noise", percent })
                              }
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                            >
                              +{percent}%
                            </button>
                          ))}
                        </div>
                      </div>


                      {/* RECALL BUTTON */}
                      <button
                        type="button"
                        onClick={handleRecall}
                        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Recall Memory
                      </button>

                    </div>


                    {/* RECOVERED / SETTLING ANIMATION */}
                    {state.recalled && (

                      state.snapshots && state.snapshots.length > 0 ? (

                        <SnapshotPlayer
                          key={state.recallVersion}
                          snapshots={state.snapshots}
                          target={selected.cells}
                        />

                      ) : (

                      <div className="mx-auto w-full max-w-sm">

                        <div className="mb-3">

                          <h3 className="text-sm font-semibold">
                            Recovered
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Hopfield network output
                          </p>

                        </div>

                        <PatternGrid
                          label="Recovered"
                          cells={state.recalled}
                          readOnly
                        />

                      </div>

                      )

                    )}

                  </div>


                  {/* =================================
                      RECALL METRICS
                      ================================= */}

                  {state.recallMetrics && (

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

                      {/* EXACT RECALL */}
                      <div className="rounded-lg bg-slate-50 p-4">

                        <p className="text-xs text-slate-500">
                          Exact recall
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {state.recallMetrics.exactRecall
                            ? "Yes"
                            : "No"}
                        </p>

                      </div>


                      {/* COMPUTATION TIME */}
                      <div className="rounded-lg bg-slate-50 p-4">

                        <p className="text-xs text-slate-500">
                          Recall time
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {state.recallMetrics.recallTimeMs.toFixed(3)} ms
                        </p>

                      </div>

                      {/* ACCURACY */}
                      <div className="rounded-lg bg-slate-50 p-4">

                        <p className="text-xs text-slate-500">
                          Accuracy
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {(
                            state.recallMetrics
                              .cellAccuracy * 100
                          ).toFixed(1)}
                          %
                        </p>

                      </div>


                      {/* MATCHING CELLS */}
                      <div className="rounded-lg bg-slate-50 p-4">

                        <p className="text-xs text-slate-500">
                          Matching cells
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {
                            state.recallMetrics
                              .matchingCells
                          }
                          /
                          {
                            state.recallMetrics
                              .totalCells
                          }
                        </p>

                      </div>


                      {/* SWEEPS */}
                      <div className="rounded-lg bg-slate-50 p-4">

                        <p className="text-xs text-slate-500">
                          Sweeps
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {
                            state.recallMetrics
                              .sweeps
                          }
                        </p>

                      </div>


                      {/* CONVERGED */}
                      <div className="rounded-lg bg-slate-50 p-4">

                        <p className="text-xs text-slate-500">
                          Converged
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {state.recallMetrics
                            .converged
                            ? "Yes"
                            : "No"}
                        </p>

                      </div>

                    </div>

                  )}

                  {/* FAILURE / RECALL ANALYSIS */}
                  {state.recallMetrics && selected && (
                    <FailureAnalysis
                      metrics={state.recallMetrics}
                      targetPatternId={selected.id}
                      targetName={selected.name}
                    />
                  )}

                  {/* EXPORT */}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleExportSession}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Export session (JSON)
                    </button>
                  </div>

                </>

              ) : (

                /* NO PATTERN SELECTED */
                <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">

                  <h3 className="text-sm font-medium text-slate-700">
                    Store a pattern to begin
                  </h3>

                  <p
                    className={`${help} mt-2 max-w-xs`}
                  >
                    Your original and its editable cue
                    will appear side by side here.
                  </p>

                </div>

              )}

            </section>

          </div>

        </div>
        )}


        {/* FOOTER */}
        {tab === "lab" && (
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
        )}


        {/* ACCESSIBILITY STATUS */}
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