import type { RecallMetrics } from "../../experiments";
import { generateNoisyCopy } from "../../experiments/noise";
import { generateNoisyCopy } from "../../experiments";

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

export interface LabScenario {
  readonly stored: readonly StoredPattern[];
  readonly selectedId: string;
  readonly cue: PatternCells;
  readonly label: string;
  readonly recallSeed: number;
  readonly maxSweeps: number;
  readonly noiseSeed: number;
}

export interface LabState {
  readonly draft: PatternCells;
  readonly name: string;
  readonly stored: readonly StoredPattern[];
  readonly selectedId: string | null;
  readonly cue: PatternCells | null;
  readonly recalled: PatternCells | null;
  readonly recallMetrics: RecallMetrics | null;
  readonly snapshots: readonly PatternCells[] | null;
  readonly recallVersion: number;
  readonly scenarioLabel: string | null;
  readonly recallSeed: number;
  readonly maxSweeps: number;
  readonly noiseSeed: number;
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

const clearedResult = {
  recalled: null,
  recallMetrics: null,
  snapshots: null,
  scenarioLabel: null,
};

export function createLabState(): LabState {
  return {
    draft: [...PRESETS[0].cells],
    name: "Pattern 1",
    stored: [],
    selectedId: null,
    cue: null,
    ...clearedResult,
    recallVersion: 0,
    recallSeed: 42,
    maxSweeps: 100,
    noiseSeed: 42,

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
  | { type: "add-noise"; percent: number }
  | {
      type: "recall-result";
      recalled: PatternCells;
      recallMetrics: RecallMetrics;
      snapshots: readonly PatternCells[];
    }
  | ({ type: "load-scenario" } & LabScenario);
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
      if (!state.selectedId || !state.cue) return state;
      assertPattern(action.recalled);
      action.snapshots.forEach(assertPattern);
      return {
        ...state,
        recalled: [...action.recalled],
        recallMetrics: action.recallMetrics,
        snapshots: action.snapshots.map((frame) => [...frame]),
        recallVersion: state.recallVersion + 1,
        announcement: "Recall completed.",
      ...state,
      recalled: [...action.recalled],
      recallMetrics: action.recallMetrics,
      snapshots: action.snapshots.map((frame) => [...frame]),
      recallVersion: state.recallVersion + 1,
      announcement: "Recall completed.",
      };
    case "store": {
      let number = state.nextNumber;
      while (state.stored.some((item) => item.id === `pattern-${number}`)) number += 1;
      const pattern: StoredPattern = {
        id: `pattern-${number}`,
        name: state.name.trim() || `Pattern ${number}`,
        cells: [...state.draft],
      };
      return {
        ...state,
        ...clearedResult,
        stored: [...state.stored, pattern],
        selectedId: pattern.id,
        cue: [...pattern.cells],
        nextNumber: number + 1,
        name: `Pattern ${number + 1}`,
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
            ...clearedResult,
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
        ...clearedResult,
        cue: [...action.cells],
        announcement: "Cue edited. Run recall again to update the result.",
      };
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
            ...clearedResult,
            cue: [...pattern.cells],
            announcement: `Cue restored from ${pattern.name}.`,
            recalled: null,
            recallMetrics: null,
            snapshots: null,
          }
        : state;
    }
    case "add-noise": {
      const pattern = state.stored.find((item) => item.id === state.selectedId);
      if (!pattern) return state;
      // Always start from the original: repeated clicks are reproducible,
      // and the selected percentage is not mistaken for cumulative damage.
      const noisy = generateNoisyCopy(pattern.cells, action.percent, state.noiseSeed);
      return {
        ...state,
        ...clearedResult,
        cue: [...noisy.cells],
        announcement: `Flipped ${noisy.flippedPixels} of 64 original cells (${action.percent}% requested noise).`,
      };
    }
    case "load-scenario": {
      assertPattern(action.cue);
      action.stored.forEach((pattern) => assertPattern(pattern.cells));
      if (
        !action.stored.some((pattern) => pattern.id === action.selectedId) ||
        new Set(action.stored.map((pattern) => pattern.id)).size !== action.stored.length
      ) {
        throw new RangeError("A scenario needs a stored target and unique pattern IDs.");
      }
      if (
        !Number.isSafeInteger(action.maxSweeps) || action.maxSweeps < 1 ||
        !Number.isFinite(action.recallSeed) || !Number.isFinite(action.noiseSeed)
      ) {
        throw new RangeError("A scenario needs finite seeds and a positive integer sweep limit.");
      }
      return {
        ...state,
        ...clearedResult,
        stored: action.stored.map((pattern) => ({ ...pattern, cells: [...pattern.cells] })),
        selectedId: action.selectedId,
        cue: [...action.cue],
        scenarioLabel: action.label,
        recallSeed: action.recallSeed,
        maxSweeps: action.maxSweeps,
        noiseSeed: action.noiseSeed,
        announcement: `${action.label} loaded into the Pattern Lab.`,
      };
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
