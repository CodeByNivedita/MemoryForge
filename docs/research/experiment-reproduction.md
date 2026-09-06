# Reproducing the MemoryForge controlled experiments

This uses code already in the repo (`src/engine/*.ts`, `src/experiments/*.ts`).
No changes to the engine or metrics were needed — the experiment runner
(`run-evaluation.ts`) already implements both controlled experiments; this
run just executed it and post-processed the output.

## What was run

Two controlled experiments, both built on the 64-neuron Hebbian/Hopfield
engine in `src/engine`:

1. **Noise experiment** — patterns fixed, noise increased.
   `patternCount = 4`, `noisePercent ∈ {0, 10, 20, 30, 40, 50}`.
2. **Memory-load experiment** — generation method fixed, memory load increased.
   `noisePercent = 20`, `patternCount ∈ {1, 2, 4, 8, 12, 16}`.

Both experiments were repeated across **5 seeds** (`11, 22, 33, 44, 55`) and,
for each seed, every stored pattern was used as the recall **target** (up to
4 targets per seed), for **215 total runs** (120 noise + 95 memory-load).
`maxSweeps = 50` throughout.

## Environment

- Node.js v22 (uses `node --experimental-strip-types` to run `.ts` files
  directly — no build step or extra dependencies required).
- No changes were made to `package.json` / `node_modules`.

## Steps

From the repo root (`MemoryForge/`):

```bash
# Node's built-in TS loader needs explicit .ts extensions in relative
# imports, which the source files don't use. Two options:

# Option A — compile with the project's existing TypeScript toolchain,
# then run the compiled JS with plain node:
npx tsc --module esnext --target es2020 --outDir /tmp/mf-build \
  src/engine/hebbian.ts src/engine/recall.ts \
  src/experiments/evaluation.ts src/experiments/pattern.ts \
  src/experiments/noise.ts src/experiments/run-evaluation.ts \
  src/experiments/run_experiments.ts
node /tmp/mf-build/experiments/run_experiments.js > experiment-results-raw.json

# Option B — what was actually done here: copy the same files to a scratch
# folder, add explicit .ts extensions to the relative import specifiers
# (e.g. `from "./pattern"` -> `from "./pattern.ts"`), then run directly:
node --experimental-strip-types experiments/run_experiments.ts > experiment-results-raw.json
```

Either way, `run_experiments.ts` calls `generateExperimentJson()`, which:

1. Calls `runControlledExperiments()` — runs every (seed × target ×
   noise-level) and (seed × target × pattern-count) combination described
   above, using `createWeightMatrix` (Hebbian learning) and `recall`
   (asynchronous Hopfield update) from `src/engine`.
2. Calls `buildExperimentOutput()`, which computes aggregate stats
   (`calculateAggregateStats`) and the framework's own best/worst example
   picks (`selectSuccessExample` / `selectFailureExample`) from
   `src/experiments/evaluation.ts` and `run-evaluation.ts`.

The raw output of that step is a JSON document containing `configuration`,
`sampleCounts`, `aggregate`, `selectedExamples`, and the full `results`
array for both experiments — this is the basis for `experiment-results.json`
delivered alongside this file.

## What was added on top (post-processing)

`experiment-results.json` re-packages the raw run above and adds:

- **`breakdown`** — exact-recall rate, average cell accuracy, and average
  sweeps grouped by `noisePercent` and by `patternCount`, computed directly
  from `results.noise` / `results.memoryLoad` (simple `groupby` + mean —
  no new engine or metric code).
- **`findings`** — a plain-language summary of the two breakdowns.
- **`selectedExamplesForGuidedDemo`** — see below. This is a different
  selection than the framework's own `selectedExamples` (kept in the output
  as `autoSelectedExamples_forComparison`), because the framework picks the
  single fastest-converging exact recall / single lowest-accuracy run across
  *all* runs, which can land on an edge case (e.g. its auto-picked success
  example happens to be a 0%-noise run — trivially "successful" but not a
  representative demo of noise tolerance).

## The two guided-demo presets

Both use the same `seed = 11`, target = `random-11`, `patternCount = 4`, so
only the noise level changes between them — useful for showing side by side.

| | Success preset | Failure preset |
|---|---|---|
| seed | 11 | 11 |
| target | random-11 | random-11 |
| patternCount | 4 | 4 |
| noisePercent | 20 | 50 |
| Reliability | **20/20 (100%)** exact recall across all seeds/targets at this config | **0/20 (0%)** exact recall across all seeds/targets at this config |

These aren't one-off lucky/unlucky runs — every sampled seed and target at
`(patternCount=4, noisePercent=20)` recalls exactly, and every one at
`(patternCount=4, noisePercent=50)` converges to a wrong state, per the
`noiseExperiment_byNoisePercent` breakdown in `experiment-results.json`.

## Files delivered

- `metrics.ts` — the metric functions used to score every run
  (`cellAccuracy`, `exactRecall`, `bipolarOverlap`,
  `overlapWithStoredPatterns`, `buildRecallMetrics`), copied unmodified from
  `src/experiments/evaluation.ts`.
- `experiment-results.json` — configuration, sample counts, aggregate
  stats, per-level breakdowns, findings, the two selected demo presets
  (with full metrics), and the complete raw results for both experiments.
- `REPRODUCE.md` — this file.
