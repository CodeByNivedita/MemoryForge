import type { RecallMetrics } from "./evaluation";
import { generateNoisyCopy } from "./noise";

export { generateNoisyCopy };
export const GRID_SIZE = 8;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export type Cell = -1 | 1;
export type PatternCells = readonly Cell[];

export interface StoredPattern {
  readonly id: string;
  readonly name: string;
  readonly cells: PatternCells;
}

export function blankPattern(): Cell[] {
  return Array<Cell>(CELL_COUNT).fill(-1);
}

export function assertPattern(cells: PatternCells): void {
  if (
    cells.length !== CELL_COUNT ||
    cells.some((cell) => cell !== -1 && cell !== 1)
  ) {
    throw new RangeError(
      "A pattern must contain exactly 64 bipolar cells (-1 or +1).",
    );
  }
}

export function toggleCell(cells: PatternCells, index: number): Cell[] {
  assertPattern(cells);
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
    throw new RangeError("Cell index must be between 0 and 63.");
  }
  return cells.map((cell, i) => (i === index ? (cell === 1 ? -1 : 1) : cell));
}

function fromRows(rows: string[]): PatternCells {
  const cells: Cell[] = rows
    .join("")
    .split("")
    .map((value) => (value === "1" ? 1 : -1));
  assertPattern(cells);
  return Object.freeze(cells);
}

// UI starter shapes only, not validated recall examples or a benchmark dataset.
export const PRESETS: readonly StoredPattern[] = Object.freeze([
  {
    id: "cross",
    name: "Cross",
    cells: fromRows([
      "00011000",
      "00011000",
      "00011000",
      "11111111",
      "11111111",
      "00011000",
      "00011000",
      "00011000",
    ]),
  },
  {
    id: "square",
    name: "Square",
    cells: fromRows([
      "00000000",
      "01111110",
      "01000010",
      "01000010",
      "01000010",
      "01000010",
      "01111110",
      "00000000",
    ]),
  },
  {
    id: "arrow",
    name: "Arrow",
    cells: fromRows([
      "00010000",
      "00111000",
      "01111100",
      "11111110",
      "00010000",
      "00010000",
      "00010000",
      "00000000",
    ]),
  },
  {
    id: "diagonal",
    name: "Diagonal",
    cells: fromRows([
      "10000000",
      "01000000",
      "00100000",
      "00010000",
      "00001000",
      "00000100",
      "00000010",
      "00000001",
    ]),
  },
]);


export interface ExperimentPattern {
  readonly id: string;
  readonly name: string;
  readonly cells: PatternCells;
}

export const VISUAL_PATTERNS: readonly ExperimentPattern[] = Object.freeze(
  PRESETS.map((preset) => ({
    id: `visual-${preset.id}`,
    name: preset.name,
    cells: preset.cells,
  })),
);

function seededPatternRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic, balanced (32/32) random bipolar pattern from a seed. */
export function generateRandomPattern(seed: number): ExperimentPattern {
  const random = seededPatternRandom(seed);
  const cells: Cell[] = Array<Cell>(CELL_COUNT).fill(-1);
  const indices = Array.from({ length: CELL_COUNT }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }
  for (let i = 0; i < CELL_COUNT / 2; i += 1) cells[indices[i]] = 1;
  return Object.freeze({ id: `random-${seed}`, name: `Random ${seed}`, cells: Object.freeze(cells) });
}

export function generateRandomPatterns(seed: number, count: number): readonly ExperimentPattern[] {
  return Object.freeze(Array.from({ length: count }, (_, i) => generateRandomPattern(seed + i)));
}

export const RANDOM_PATTERNS: readonly ExperimentPattern[] = generateRandomPatterns(1, 8);
export interface LabState {
  readonly draft: PatternCells;
  readonly name: string;
  readonly stored: readonly StoredPattern[];
  readonly selectedId: string | null;
  readonly cue: PatternCells | null;

  // Hopfield recall result
  readonly recalled: PatternCells | null;
  readonly recallMetrics: RecallMetrics | null;
  readonly snapshots: readonly PatternCells[] | null;
  // Incremented on every recall so the snapshot player can key off it and
  // reset its own frame/playback state without syncing via an effect.
  readonly recallVersion: number;

  // Set when the current stored patterns / cue came from a
  // dashboard-selected success/failure preset (for labelling in the UI).
  readonly scenarioLabel: string | null;

  readonly nextNumber: number;
  readonly announcement: string;
}

export function createLabState(): LabState {
  return {
    draft: [...PRESETS[0].cells],
    name: "Pattern 1",
    stored: [],
    selectedId: null,
    cue: null,

    recalled: null,
    recallMetrics: null,
    snapshots: null,
    recallVersion: 0,

    scenarioLabel: null,

    nextNumber: 1,
    announcement: "",
  };
}

export type LabAction =
  | { type: "draft"; cells: PatternCells }
  | { type: "name"; name: string }
  | { type: "preset"; id: string }
  | { type: "store" }
  | { type: "select"; id: string }
  | { type: "cue"; cells: PatternCells }
  | { type: "restore-cue" }
  | { type: "add-noise"; percent: number }
  | {
      type: "recall-result";
      recalled: PatternCells;
      recallMetrics: RecallMetrics;
      snapshots: readonly PatternCells[];
    }
  | {
      type: "load-scenario";
      stored: readonly StoredPattern[];
      selectedId: string;
      cue: PatternCells;
      label: string;
    };

export function labReducer(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case "draft":
      assertPattern(action.cells);
      return { ...state, draft: [...action.cells] };
    case "name":
      return { ...state, name: action.name.slice(0, 40) };
    case "preset": {
      const preset = PRESETS.find((item) => item.id === action.id);
      return preset
        ? {
            ...state,
            draft: [...preset.cells],
            name: preset.name,
            announcement: `${preset.name} loaded into the drawing. Stored patterns are unchanged.`,
          }
        : state;
    }
    case "recall-result":
      assertPattern(action.recalled);

      return {
      ...state,
      recalled: [...action.recalled],
      recallMetrics: action.recallMetrics,
      snapshots: action.snapshots.map((frame) => [...frame]),
      recallVersion: state.recallVersion + 1,
      announcement: "Recall completed.",
      };
    case "store": {
      const pattern: StoredPattern = {
        id: `pattern-${state.nextNumber}`,
        name: state.name.trim() || `Pattern ${state.nextNumber}`,
        cells: [...state.draft],
      };
      return {
        ...state,
        stored: [...state.stored, pattern],
        selectedId: pattern.id,
        cue: [...pattern.cells],
        nextNumber: state.nextNumber + 1,
        name: `Pattern ${state.nextNumber + 1}`,
        scenarioLabel: null,
        announcement: `${pattern.name} stored and selected. A separate cue is ready to edit.`,
      };
    }
    case "select": {
      const pattern = state.stored.find((item) => item.id === action.id);
      return pattern
        ? {
            ...state,
            selectedId: pattern.id,
            cue: [...pattern.cells],
            recalled: null,
            recallMetrics: null,
            snapshots: null,
            announcement: `${pattern.name} selected. Cue restored from its original.`,
          }
        : state;
    }
    case "cue":
  if (!state.selectedId) return state;
  assertPattern(action.cells);

  return {
    ...state,
    cue: [...action.cells],
    recalled: null,
    recallMetrics: null,
    snapshots: null,
  };
    case "restore-cue": {
      const pattern = state.stored.find((item) => item.id === state.selectedId);
      return pattern
        ? {
            ...state,
            cue: [...pattern.cells],
            announcement: `Cue restored from ${pattern.name}.`,
            recalled: null,
            recallMetrics: null,
            snapshots: null,
          }
        : state;
    }
    case "add-noise": {
      if (!state.selectedId || !state.cue) return state;

      const seed = Math.floor(Math.random() * 1_000_000);
      const noisy = generateNoisyCopy(state.cue, action.percent, seed);

      return {
        ...state,
        cue: [...noisy.cells],
        recalled: null,
        recallMetrics: null,
        snapshots: null,
        announcement: `Flipped ${noisy.flippedPixels} cell${noisy.flippedPixels === 1 ? "" : "s"} (${action.percent}% noise) in the cue.`,
      };
    }
    case "load-scenario": {
      // Loading a preset scenario replaces the whole memory bank so the
      // Pattern Lab exactly matches the dashboard configuration (same
      // stored patterns, same target, same noisy cue).
      return {
        ...state,
        stored: action.stored.map((pattern) => ({ ...pattern })),
        selectedId: action.selectedId,
        cue: [...action.cue],
        recalled: null,
        recallMetrics: null,
        snapshots: null,
        scenarioLabel: action.label,
        announcement: `${action.label} loaded into the Pattern Lab.`,
      };
    }
  }
}