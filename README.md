<div align="center">

# MemoryForge

**A small network. Shared memories. A result you can inspect.**

An interactive introduction to associative memory, Hebbian learning, and the surprising difference between a stable answer and a correct one.

[Get started](#get-started) · [Explore the demo](#the-demo) · [How it works](#under-the-hood) · [Results](#the-evidence) · [BDH connection](#the-bdh-connection)

React 19 · TypeScript · Vite 8 · Tailwind CSS 4
</div>

## Why we built it

You see a damaged picture. A neural network fills in the missing details. It looks convincing-but what happened between the input and the answer?

MemoryForge opens up that process. Each pixel is a neuron, each connection carries an association, and every update can be inspected. You can store your own patterns, damage a separate copy, and follow the network as it tries to recall the original.

Then you can make the memories compete.

This is a working **64-neuron Hopfield network**, not an animation with a predetermined ending. The calculations run locally in your browser-no GPU, backend, API key, or language model required.

## The demo

Start with **Learn**. A five-step experiment takes you from your first stored memory to a result that challenges your intuition.

**Store → Damage → Recall → Add memories → Compare**

1. **Store four patterns.** See how matching and opposing pixels contribute to shared connection weights.
2. **Damage the cue.** Flip 13 of the target's 64 pixels while keeping the original untouched.
3. **Run recall.** Watch the recorded neuron decisions recover the target.
4. **Add twelve competing memories.** Keep the target, damaged cue, and update-order seed unchanged.
5. **Compare the answers.** Both runs settle. Only one recalls the target exactly.

### Same clue. Different memory bank.


|                                             | Four memories | Sixteen memories |
| ------------------------------------------- | ------------- | ---------------- |
| Damaged pixels                              | 13 / 64       | The same 13 / 64 |
| Final target match                          | **64 / 64**   | **52 / 64**      |
| Reached a stable state                      | Yes           | Yes              |
| Sweeps, including the final unchanged sweep | 2             | 3                |

Computed on **8 September 2026** using the current engine.

This is a selected, reproducible example, not a universal capacity threshold. The lesson computes both answers rather than substituting an expected result.

## What you can explore


| Page         | Start here when you want to…                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------ |
| **Home**     | Understand the idea and choose your starting point.                                              |
| **Learn**    | Follow a guided experiment, then check your understanding.                                       |
| **Lab**      | Draw patterns, store memories, change cue noise, and inspect recall.                             |
| **Evidence** | Compare noise and memory-load experiments, export results, and replay selected cases in the Lab. |
| **Research** | Explore a small Hebbian write and understand where the BDH analogy begins and ends.              |

### Look inside the computation

- **Watch storage happen.** Replay the newest pattern's exact contribution to the weight matrix. Both connection directions update together; self-connections stay zero.
- **Follow one neuron.** Inspect its previous state, weighted input, and recorded next state. Step through updates or whole sweeps.
- **Change your view.** Switch between a pixel-aligned 2D map and a rotatable perspective view of the same 64 neurons.
- **Inspect the evidence.** See energy by sweep, overlap with stored patterns, and recall performance across noise levels and memory loads.
- **Take the results with you.** Export a Lab session or the experiment batch as JSON.

Storage replay illustrates a matrix that has already been computed. Recall playback displays recorded states. **Neither playback speed nor camera position changes the mathematical result.** During recall, connections are highlighted for inspection; their weights do not change.

The Lab's output grid follows the playback position, while its final metrics describe the completed run. Original, cue, and output remain separate.

The editor supports arrow-key navigation and Space/Enter to toggle cells. Automatic playback respects reduced-motion preferences.

## Get started

Use **Node.js 24.x**, or **22.x version 22.13 or later**, with npm.

From the repository root & Open the local URL printed by Vite.

```sh
npm ci
npm run dev
```

### Development commands

```sh
npm run dev          # Local development
npm run build        # Type-check and build into dist/
npm run lint         # ESLint; warnings are treated as failures
npm run format       # Format source files in place
```

**Current checkout status - checked 8 September 2026:** lint passes.

## Under the hood

MemoryForge implements a classical Hopfield network directly in TypeScript. Storing patterns uses a Hebbian outer-product rule rather than gradient descent.

**Representation.** An 8 × 8 pattern becomes 64 bipolar values: `+1` for ON and `−1` for OFF.

**Storage.** Each pattern contributes to a shared, symmetric 64 × 64 weight matrix. Matching signs contribute `+1/64`; opposite signs contribute `−1/64`. The diagonal is zero.

**Recall.** Neurons update one at a time using the latest states. Positive weighted input selects `+1`, negative input selects `−1`, and zero preserves the current value.

**Stopping.** A sweep visits every neuron once. Recall ends after a complete unchanged sweep or the configured limit. A seed makes the shuffled update order reproducible; without one, the engine uses index order.

**Evaluation.** Only after recall do we compare the answer with the target. The recall function receives weights, a cue, a seed, and settings—**never the original answer**.

<details>
<summary>Equations, metrics, and complexity</summary>

For stored patterns `ξᵖ` and current state `s`:

```text
Storage:       W[i,j] = (1/64) × Σₚ ξᵖ[i] × ξᵖ[j],  i ≠ j
               W[i,i] = 0

Weighted input: h[i] = Σⱼ W[i,j] × s[j]

Update:         s[i] = +1        if h[i] > 0
                      −1        if h[i] < 0
                      unchanged if h[i] = 0

Energy:         E(s) = −½ Σᵢⱼ W[i,j] × s[i] × s[j]
```

- **Exact recall:** every output cell matches the intended target.
- **Cell accuracy:** matching cells divided by 64.
- **Bipolar overlap:** `Σᵢ output[i] × pattern[i] / 64`. A value of +1 means identical, −1 means inverted, and 0 means half the cells match.
- **Convergence:** a full sweep changed no states.
- **Iteration limit:** the cap was reached without confirmed convergence.
- **Recall time:** measured computation duration, which varies by device and instrumentation.

For this symmetric, zero-diagonal, asynchronous model, energy cannot increase. That does not guarantee the intended memory, the nearest stored pattern, or a global energy minimum.

For `N` neurons, `P` stored patterns, and `S` sweeps:

- Weight construction: `O(PN²)` time.
- Recall: `O(SN²)` time.
- Weight matrix: `O(N²)` space.
- Full per-neuron state trace: up to `O(SN²)` additional space.
- Sweep-only snapshots: `O(SN)` additional space.

MemoryForge fixes `N = 64`.

</details>

## The BDH connection

The guided lesson asks a useful question: **what is changing - the neuron activity, the stored associations, or the trained parameters?**

In MemoryForge, storing a pattern changes `W`; recalling it changes neuron activity while `W` stays fixed. The Dragon Hatchling paper describes a different system with fixed parameters and evolving connection state, including an introductory Hebbian update:

```text
σ(i,j) ← σ(i,j) + Y(i)X(j)
```

The shared principle is an association strengthened through co-activation. The Research page makes that idea tangible with a 2 × 2 outer-product write and a matrix-vector read. See [The Dragon Hatchling, §1.2, equations 1–2](https://arxiv.org/html/2509.26507v1#S1.SS2).

**This is a teaching connection, not an implementation of BDH or BDH-CQ.** The numerical widget is simplified, and our Hopfield results do not establish BDH accuracy, convergence, or benchmark performance.

## The evidence

The Evidence page runs the **same engine as the Lab**, live in the browser. Results are not loaded from the historical JSON file.

The experiment suite uses five base seeds `11, 22, 33, 44, 55`and random patterns containing exactly 32 ON and 32 OFF pixels.


| Experiment  | Configuration                                                                | Runs | Exact recalls         |
| ----------- | ---------------------------------------------------------------------------- | ---- | --------------------- |
| Noise       | Four memories; 0–50% noise in 10-point steps; all four targets per seed     | 120  | **88 / 120 · 73.3%** |
| Memory load | 1, 2, 4, 8, 12, or 16 memories; 20% noise; first up to four targets per load | 95   | **63 / 95 · 66.3%**  |

All **215 runs converged**. Only **151 recalled the intended target exactly**. These figures were recomputed on 8 September 2026 and describe these configurations - not a general accuracy score.

For reproducibility:

- Pattern seed = base seed + pattern index.
- Noise seed = base seed + 1000; recall seed = base seed + 2000.
- Noise flips `round(64 × percentage / 100)` distinct cells.
- Memory banks are nested for a given base seed.
- Every run allows at most 50 sweeps.

The smallest memory loads have fewer evaluated targets, so the aggregate load curve is not a single-target controlled comparison. Visual shapes are a separate group; the reported rates do not apply to arbitrary drawings. Lines connect measured categories, not predictions for untested settings.

### Export or reproduce a run

In **Evidence**, select **Export full results (JSON)**. In **Lab**, open **Technical details & export** to save the current session.

<details>
<summary>Run the experiment suite from the command line</summary>

After installing dependencies, run this from the repository root:

```sh
node --input-type=module -e 'import {createServer} from "vite"; const s=await createServer({logLevel:"silent",server:{middlewareMode:true},appType:"custom"}); try {const m=await s.ssrLoadModule("/src/experiments/run-evaluation.ts"); console.log(m.generateExperimentJson());} finally {await s.close();}'
```

The command prints fresh JSON. Timestamps and timings vary. The command-line runner and dashboard use different example-selection policies, so their selected examples can differ.

</details>

## Project structure

React calls the local engine directly. There are no API services or message queues between the interface and the computation.

<details>
<summary>Find your way around the source</summary>

```text
src/
├── main.tsx                 React entry point
├── App.tsx                  Active navigation and page shell
├── sections/
│   ├── Home.tsx             Introduction
│   ├── GuidedLesson.tsx     Five-step experiment
│   ├── lab.tsx              Pattern editor and recall integration
│   ├── ExperimentDashboard.tsx
│   └── Research.tsx         BDH explanation and numerical example
├── engine/                  Storage, recall, energy, and storage replay
├── experiments/             Patterns, noise, metrics, and batch experiments
├── components/lab/          Grids, network, playback, analysis, and charts
└── index.css                Shared theme and Tailwind styling

utils/download/              JSON export
docs/research/               Scientific and reproduction notes
```

Visualizations use SVG. ESLint, Prettier, and Vitest are configured as development tools.

</details>

## Scope and limitations

MemoryForge is an educational model, not a biological brain, chatbot, or general-purpose image restoration system.

- **Fixed scale:** 8 × 8 patterns and 64 neurons. Lab recall defaults to 100 sweeps; the lesson and batch experiments use 50. The engine accepts limits from 1 to 1,000.
- **Local computation:** runs synchronously on the main thread. A worker with progress and cancellation is not implemented.
- **Finite resources:** there is no explicit memory-bank cap, but larger banks and recorded traces cost time and memory. No universal sub-second performance claim is made.
- **Session lifetime:** Lab state survives page navigation but resets on reload. JSON export is available; import, accounts, and server persistence are not.
- **Release work:** the build blockers and missing tests above remain open. A complete accessibility audit and deployed desktop/mobile verification are also needed.

## Contributors

Built around the shared project plan of **Indra, Nivedita, Amrit, and Raghav**, spanning integration, the memory engine, scientific explanation, and evaluation.

## Sources

- [Hopfield (1982)](https://doi.org/10.1073/pnas.79.8.2554) : *Neural networks and physical systems with emergent collective computational abilities*.
- [The Dragon Hatchling](https://arxiv.org/html/2509.26507v1) : primary source for the BDH connection.
- [Pathway's official BDH repository](https://github.com/pathwaycom/bdh)
- [Research note](docs/research/associative_memory_and_bdh.md) : equations and the limits of the analogy.
- [Reproduction notes](docs/research/experiment-reproduction.md) : experimental configuration and historical results. Their test-suite references predate the current checkout.
