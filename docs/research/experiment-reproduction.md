# Reproducing the MemoryForge controlled experiments

The dashboard and experiment runner use the actual 64-neuron Hebbian
weight matrix and asynchronous Hopfield recall in `src/engine`.
No model predictions or synthetic recall outcomes are substituted.

## Run and verify

From the repository root, with dependencies installed:

```sh
npm test
npm run build
npm run lint
npm run dev
```

Open the local URL printed by Vite, choose **Experiment Dashboard**, then
**Export full results (JSON)**. The dashboard computes all 215 runs in the
browser and exports their configuration, aggregate statistics, chart
breakdowns, selected examples, and individual metrics.

For JSON from the command line, use the existing Vite TypeScript loader
(no new dependency, temporary source copies, or import rewriting needed):

```sh
node --input-type=module -e 'import {createServer} from "vite"; const s=await createServer({logLevel:"silent",server:{middlewareMode:true},appType:"custom"}); try {const m=await s.ssrLoadModule("/src/experiments/run-evaluation.ts"); console.log(m.generateExperimentJson());} finally {await s.close();}'
```

The command-line output uses `buildExperimentOutput` and its own automatic
example selection. The dashboard additionally groups chart buckets and
chooses guided presets from the strongest/weakest noise configurations.
These are different selection policies applied to the same computed runs.

## Experimental controls

- Grid: 8×8, 64 bipolar cells; random patterns have 32 ON and 32 OFF cells.
- Base seeds: 11, 22, 33, 44, 55.
- Pattern at index `i`: generator seed `seed + i`.
- Cue noise: seed `seed + 1000`; flip `round(64 × percent / 100)` distinct cells.
- Recall order: seed `seed + 2000`; maximum 50 complete sweeps.
- Zero local input preserves the neuron's old state.
- Convergence means an entire sweep made no changes. It does not mean
  the network recovered the intended target.

| Experiment | Fixed | Varied | Samples |
| --- | --- | --- | --- |
| Noise | Four patterns per seed; all four targets | 0, 10, 20, 30, 40, 50% noise | 120 |
| Memory load | Generator and 20% noise | 1, 2, 4, 8, 12, 16 patterns; first min(count, 4) targets | 95 |

The memory-load experiment does **not** evaluate every target when more
than four patterns are stored.

## Verified results and demo presets

The checked-in `src/experiments/results/recall-results.json` records 151/215
exact recalls: 88/120 noise runs and 63/95 memory-load runs. All 215 runs
converged. Regression tests compare every run's metrics with that artifact,
excluding computation time, which varies by machine and run.

The current dashboard chooses the highest tested noise level tied for the
best exact-recall rate, and the lowest level tied for the worst rate:

| Guided preset | Seed / target | Stored patterns | Noise | Exact recalls in sampled bucket |
| --- | --- | --- | --- | --- |
| Success | 11 / random-11 | 4 | 30% | 20/20 |
| Failure | 11 / random-11 | 4 | 50% | 0/20 |

The historical JSON's guided success example uses 20% noise, which also
scored 20/20. That is not a contradiction with the live dashboard's 30% pick.

Loading a preset replaces the lab memory bank and copies the exact cue,
recall seed, and sweep limit. Press **Recall Memory** to reproduce it.
Editing the cue, selecting a target, restoring the cue, adding noise, or
storing another pattern invalidates the previous result and preset label.
The lab's noise buttons regenerate a seeded copy from the original rather
than accumulating flips on an already damaged cue.

Playback shows the input cue at sweep zero, followed by the engine's
recorded post-sweep states. Its frame match percentage describes the
displayed state; the metrics below it describe the final computed output.
Session JSON includes the cue, memory bank, recall seed, sweep limit,
final metrics, and recorded snapshots.

Sample success rates are not guarantees for other seeds, visual patterns,
or memory loads. The failure analysis reports observed states without
claiming that overlap metrics alone prove the cause of a failure.
