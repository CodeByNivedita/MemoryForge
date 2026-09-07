# MemoryForge

An interactive, browser-local introduction to associative memory with a classical 64-neuron Hopfield network.

## Run locally

Requires a Node.js version supported by Vite 8 and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. No API keys, backend, or external AI service are required.

## Check the project

```sh
npm test
npm run lint
npm run build
```

## User journey

- **Overview:** try a recorded recovery and discover the learning path.
- **Learn:** store four memories, damage a cue, compute recall, add competing memories, and distinguish convergence from correctness.
- **Playground:** draw/store patterns, keep the target separate from the cue, adjust seeded noise, run recall, and replay recorded sweeps.
- **Network stage:** a default pixel-aligned 8×8 map and an optional perspective-projected 3D view of the same 64 neurons, with camera rotation and optional full connection context. Geometry is presentation only, never a model input.
- **Storage replay:** storing a pattern animates its exact normalized outer-product contribution. Both directions update together; the diagonal stays zero. The final replay matrix matches the engine’s learned matrix.
- **Neuron inspector:** the network and recalled-output grid share one recorded timeline. Play, pause, step one neuron, jump a recorded sweep, restart, and change viewing speed. Inspect weighted inputs, energy and overlap. New recalls play automatically unless reduced motion is requested.
- **Evidence:** compare controlled noise/memory-load experiments and load reproducible examples into the playground.
- **Research:** understand the limited connection to Hebbian memory in BDH, with primary sources and an explicitly simplified illustration.

Navigation uses hash URLs so learning pages also work on static hosting. Playground state survives page navigation but is in-memory only; reloading resets it. Existing exports support saving experiment data.

## Scientific contract

Each 8×8 pattern contains 64 bipolar values. Storage sums normalized outer products: W_ij = sum_p(x_i^p x_j^p)/64 for i != j; diagonal entries are zero.

Recall updates one neuron at a time using the latest states. A positive weighted input selects +1, a negative input selects -1, and zero retains the previous value. The seed controls update order. A complete unchanged sweep indicates convergence; reaching the limit does not.

The engine never receives the intended target. The target is used only for evaluation. Weights remain fixed throughout recall. Playback uses recorded computations; changing playback speed cannot change the result.

Energy E = -0.5 sum_ij(W_ij s_i s_j) is non-increasing for these symmetric zero-diagonal weights and asynchronous updates. Convergence does **not** guarantee the intended memory, the closest stored memory, or a global energy minimum.

## Scope and limitations

This is an educational simulation, not a biological brain, language model, or implementation of BDH. Visual shapes are not validated recall guarantees. Balanced random patterns and visual patterns should be evaluated separately. Fixed-seed experiments demonstrate observed outcomes, not universal capacity thresholds.

Computation currently runs locally on the main thread at the bounded 64-neuron scale. It is not a large-scale asynchronous experiment service. There is no account system, server persistence, or deployment configured by this change.

See [the research note](docs/research/associative_memory_and_bdh.md) for the mathematical assumptions and sources.
## Interface structure

The lab uses one context-sensitive editor: create a pattern, then switch to its separate cue. A single noise control and recall action drive the experiment. The memory bank, network stage, state comparison and final evaluation have distinct roles. Technical settings, the matrix and export are grouped under an expandable panel. Styling uses shared Tailwind utilities for surfaces, type, fields and button states; the network uses a light canvas with numbered neurons, signed connections and an active-update ring.
