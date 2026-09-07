import { generateNoisyCopy } from "./noise";

export { generateNoisyCopy };
export const GRID_SIZE = 8;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;

export type Cell = -1 | 1;
export type PatternCells = readonly Cell[];

export interface ExperimentPattern {
  readonly id: string;
  readonly name: string;
  readonly gridSize: number;
  readonly activePixels: number;
  readonly cells: PatternCells;
}

function fromRows(rows: readonly string[]): PatternCells {
  if (rows.length !== GRID_SIZE) {
    throw new RangeError("A pattern must contain exactly 8 rows.");
  }

  if (rows.some((row) => row.length !== GRID_SIZE)) {
    throw new RangeError("Each pattern row must contain exactly 8 cells.");
  }

  const cells: Cell[] = rows
    .join("")
    .split("")
    .map((value) => (value === "1" ? 1 : -1));

  return Object.freeze(cells);
}

function createPattern(
  id: string,
  name: string,
  rows: readonly string[],
): ExperimentPattern {
  const cells = fromRows(rows);

  return Object.freeze({
    id,
    name,
    gridSize: GRID_SIZE,
    activePixels: cells.filter((cell) => cell === 1).length,
    cells,
  });
}

/**
 * Structured visual patterns.
 *
 * These are kept separate from RANDOM_PATTERNS because spatial structure
 * may affect memory and retrieval behaviour.
 */
export const VISUAL_PATTERNS: readonly ExperimentPattern[] =
  Object.freeze([
    createPattern("visual-cross", "Cross", [
      "00011000",
      "00011000",
      "00011000",
      "11111111",
      "11111111",
      "00011000",
      "00011000",
      "00011000",
    ]),

    createPattern("visual-square", "Square", [
      "00000000",
      "01111110",
      "01000010",
      "01000010",
      "01000010",
      "01000010",
      "01111110",
      "00000000",
    ]),

    createPattern("visual-arrow", "Arrow", [
      "00010000",
      "00111000",
      "01111100",
      "11111110",
      "00010000",
      "00010000",
      "00010000",
      "00000000",
    ]),

    createPattern("visual-diagonal", "Diagonal", [
      "10000000",
      "01000000",
      "00100000",
      "00010000",
      "00001000",
      "00000100",
      "00000010",
      "00000001",
    ]),
  ]);


function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;

    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate an 8x8 random pattern with exactly 32 active (+1)
 * and 32 inactive (-1) pixels.
 *
 * The seed makes the pattern reproducible.
 */
export function generateRandomPattern(seed: number): ExperimentPattern {
  const cells: Cell[] = Array(CELL_COUNT).fill(-1);
  const random = seededRandom(seed);

  const indices = Array.from(
    { length: CELL_COUNT },
    (_, index) => index,
  );

  // Deterministic Fisher-Yates shuffle.
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));

    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Exactly half ON and half OFF.
  for (let i = 0; i < CELL_COUNT / 2; i += 1) {
    cells[indices[i]] = 1;
  }

  return Object.freeze({
    id: `random-${seed}`,
    name: `Random ${seed}`,
    gridSize: GRID_SIZE,
    activePixels: CELL_COUNT / 2,
    cells: Object.freeze(cells),
  });
}

export function generateRandomPatterns(seed: number, count: number): readonly ExperimentPattern[] {
  return Object.freeze(Array.from({ length: count }, (_, i) => generateRandomPattern(seed + i)));
}

export const RANDOM_PATTERNS: readonly ExperimentPattern[] = generateRandomPatterns(1, 8);
/**
 * Generate a collection of reproducible random patterns.
 */
export function generateRandomPatterns(
  seeds: readonly number[],
): readonly ExperimentPattern[] {
  return Object.freeze(seeds.map(generateRandomPattern));
}

/**
 * Fixed random patterns used by the experiment suite.
 */
export const RANDOM_PATTERNS = generateRandomPatterns([
  11,
  22,
  33,
  44,
]);
/**
 * Create a deterministic noisy copy of a pattern.
 *
 * noisePercent = percentage of cells to flip.
 * The same seed always produces the same noisy cue.
 */
export function generateNoisyCopy(
  cells: PatternCells,
  noisePercent: number,
  seed: number,
): PatternCells {
  if (cells.length !== CELL_COUNT) {
    throw new RangeError(
      `Pattern must contain exactly ${CELL_COUNT} cells.`,
    );
  }

  if (noisePercent < 0 || noisePercent > 100) {
    throw new RangeError(
      "noisePercent must be between 0 and 100.",
    );
  }

  const result: Cell[] = [...cells];
  const random = seededRandom(seed);

  const flipCount = Math.round(
    (CELL_COUNT * noisePercent) / 100,
  );

  const indices = Array.from(
    { length: CELL_COUNT },
    (_, index) => index,
  );

  // Deterministic shuffle.
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));

    [indices[i], indices[j]] = [
      indices[j],
      indices[i],
    ];
  }

  // Flip exactly the requested number of cells.
  for (let i = 0; i < flipCount; i += 1) {
    const index = indices[i];
    result[index] = result[index] === 1 ? -1 : 1;
  }

  return Object.freeze(result);
}