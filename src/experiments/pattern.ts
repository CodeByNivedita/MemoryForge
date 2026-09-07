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