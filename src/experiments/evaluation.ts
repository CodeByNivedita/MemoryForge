
import type { PatternCells } from "./pattern";

const CELL_COUNT = 64;

export interface StoredPatternForEvaluation {
  readonly id: string;
  readonly name: string;
  readonly cells: PatternCells;
}

export interface PatternOverlap {
  readonly patternId: string;
  readonly patternName: string;
  readonly overlap: number;
  readonly cellAccuracy: number;
}

export interface RecallMetrics {
  exactRecall: boolean;
  cellAccuracy: number;
  matchingCells: number;
  totalCells: number;

  overlaps: PatternOverlap[];

  converged: boolean;
  hitIterationLimit: boolean;

  sweeps: number;
  maxSweeps: number;

  recallTimeMs: number;
}

/**
 * Validate that a pattern contains exactly 64 bipolar cells.
 */
function assertBipolar(
  cells: readonly number[],
  label: string,
): void {
  if (
    cells.length !== CELL_COUNT ||
    cells.some((cell) => cell !== -1 && cell !== 1)
  ) {
    throw new RangeError(
      `${label} must contain exactly 64 bipolar cells.`,
    );
  }
}

/**
 * Fraction of cells that exactly match the target.
 *
 * Example:
 * 64/64 = 1.0
 * 60/64 = 0.9375
 */
export function cellAccuracy(
  output: readonly number[],
  target: readonly number[],
): number {
  assertBipolar(output, "Output");
  assertBipolar(target, "Target");

  let matches = 0;

  for (let i = 0; i < CELL_COUNT; i += 1) {
    if (output[i] === target[i]) {
      matches += 1;
    }
  }

  return matches / CELL_COUNT;
}

/**
 * True only when every output cell matches the target.
 */
export function exactRecall(
  output: readonly number[],
  target: readonly number[],
): boolean {
  return cellAccuracy(output, target) === 1;
}

/**
 * Bipolar overlap:
 *
 * +1  = identical
 *  0  = unrelated
 * -1  = exact inverse
 *
 * Formula:
 *     (output · pattern) / 64
 */
export function bipolarOverlap(
  output: readonly number[],
  pattern: readonly number[],
): number {
  assertBipolar(output, "Output");
  assertBipolar(pattern, "Pattern");

  let dotProduct = 0;

  for (let i = 0; i < CELL_COUNT; i += 1) {
    dotProduct += output[i] * pattern[i];
  }

  return dotProduct / CELL_COUNT;
}

/**
 * Compare the recalled output against EVERY stored pattern.
 */
export function overlapWithStoredPatterns(
  output: readonly number[],
  storedPatterns: readonly StoredPatternForEvaluation[],
): readonly PatternOverlap[] {
  return storedPatterns.map((pattern) => ({
    patternId: pattern.id,
    patternName: pattern.name,
    overlap: bipolarOverlap(output, pattern.cells),
    cellAccuracy: cellAccuracy(output, pattern.cells),
  }));
}

/**
 * Build the complete result for one recall run.
 */
export function buildRecallMetrics(
  output: readonly number[],
  target: StoredPatternForEvaluation,
  storedPatterns: readonly StoredPatternForEvaluation[],
  engineResult: {
    readonly converged: boolean;
    readonly sweepsExecuted: number;
  },
  maxSweeps: number,
  recallTimeMs: number,
): RecallMetrics {
  const accuracy = cellAccuracy(output, target.cells);

  return {
    // 1. Exact recall
    exactRecall: accuracy === 1,

    // 2. Cell accuracy
    cellAccuracy: accuracy,
    matchingCells: Math.round(accuracy * CELL_COUNT),
    totalCells: CELL_COUNT,

    // 3. Overlap with every stored pattern
    overlaps: [...overlapWithStoredPatterns(
      output,
      storedPatterns,
    )],

    // 4. Fixed point / iteration limit
    converged: engineResult.converged,
    hitIterationLimit:
      !engineResult.converged &&
      engineResult.sweepsExecuted >= maxSweeps,

    // 5. Engine statistics
    sweeps: engineResult.sweepsExecuted,
    maxSweeps,

    recallTimeMs,
  };
}

