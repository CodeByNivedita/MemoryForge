# MemoryForge project guidance

Read `docs/build-plan.md` fully before planning or changing this project. It is the user's saved build plan, including team ownership and ordered checkpoints. Do not execute every step automatically: follow the current user request and implement only the assigned step. Later explicit user instructions override this guidance.

## Scope and preferences

- The repository and application are currently named MemoryForge. The original plan calls the project Engram; preserve MemoryForge unless the user requests a rename.
- Use React, TypeScript, Vite, and Tailwind utilities. Preserve the clean light theme unless the user requests a different design.
- Do not add extra features, pages, APIs, models, dependencies, or deployment work beyond the requested step.
- Current implemented milestone at the time this note was saved: Step 3, the UI-only pattern editor. Reinspect the repository each time; this is not a claim that later steps are done.
- Store Pattern currently saves in-memory UI snapshots, not neural weights. Refreshing clears session state.
- Keep draft, saved original, and editable cue separate. Never mutate a saved original while editing a cue.

## Ownership

- Indra: shared architecture/types, pattern editor, frontend integration and final assembly.
- Raghav: `src/engine`, storage, recall, traces and engine tests.
- Nivedita: `src/experiments`, evaluation, seeded inputs/noise and `src/components/charts`.
- Amrit: research, `src/content`, `src/sections/learn`, `src/sections/bdh`, and `docs/research`.
- Coordinate shared contracts; do not implement another member's work unless the user assigns it.

## Scientific and integration boundaries

- The intended live model is a classical asynchronous Hopfield network, not BDH, a chatbot, or a prerecorded animation.
- Patterns contain 64 bipolar values (-1 or +1). Future storage uses symmetric Hebbian weights and zero diagonal.
- Future recall receives weights, cue, seed and settings, never the correct original. Original patterns are for display/evaluation only.
- Use actual computed traces and the same engine for evaluation. Do not promise recall success or equate a fixed point with a correct answer.
- Keep visual and random experimental patterns distinct. BDH comparisons must be source-backed and explicitly limited.

## Verification and changes

- For review requests, inspect and report; do not silently fix implementation issues.
- Preserve user edits. The user removed the earlier test files; do not silently restore them.
- Run relevant build/lint/tests and report their actual results. A missing test suite is not a passing test suite.
- Do not commit, push, publish, or send team messages unless requested.
