import type { RecallMetrics } from "../../experiments";

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

export interface LabState {
  readonly draft: PatternCells;
  readonly name: string;
  readonly stored: readonly StoredPattern[];
  readonly selectedId: string | null;
  readonly cue: PatternCells | null;

  // Hopfield recall result
  readonly recalled: PatternCells | null;
  readonly recallMetrics: RecallMetrics | null;

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
  | {
      type: "recall-result";
      recalled: PatternCells;
      recallMetrics: RecallMetrics;
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
          }
        : state;
    }
  }
}
