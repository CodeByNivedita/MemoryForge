import { createWeightMatrix } from "../engine/hebbian";
import { recall } from "../engine/recall";

import {
  buildRecallMetrics,
  type RecallMetrics,
  type StoredPatternForEvaluation,
} from "./evaluation";

import {
  generateRandomPattern,
  generateNoisyCopy,
} from "./pattern";

const CELL_COUNT = 64;
const DEFAULT_MAX_SWEEPS = 50;

export interface RecallRun {
  experiment: string;

  seed: number;
  targetPatternId: string;
  targetPatternName: string;

  patternCount: number;
  noisePercent: number;

  metrics: RecallMetrics;
}

export interface ExperimentConfig {
  seed: number;
  patternCount: number;
  noisePercent: number;
  targetIndex: number;
  maxSweeps?: number;
}

/**
 * Create stored patterns using the project's existing
 * deterministic pattern generator.
 */
function createStoredPatterns(
  seed: number,
  count: number,
): StoredPatternForEvaluation[] {
  const patterns: StoredPatternForEvaluation[] = [];

  for (let i = 0; i < count; i += 1) {
    const pattern = generateRandomPattern(seed + i);

    patterns.push({
      id: pattern.id,
      name: pattern.name,
      cells: pattern.cells,
    });
  }

  return patterns;
}

/**
 * Run ONE real store -> recall experiment.
 */
export function runRecallExperiment(
  config: ExperimentConfig,
): RecallRun {
  const maxSweeps = config.maxSweeps ?? DEFAULT_MAX_SWEEPS;
  if (!Number.isSafeInteger(config.patternCount) || config.patternCount < 1) {
    throw new RangeError("patternCount must be a positive integer.");
  }
  if (!Number.isFinite(config.seed)) throw new RangeError("seed must be finite.");
  if (!Number.isSafeInteger(maxSweeps) || maxSweeps < 1) {
    throw new RangeError("maxSweeps must be a positive integer.");
  }

  const storedPatterns = createStoredPatterns(
    config.seed,
    config.patternCount,
  );

  if (
    !Number.isInteger(config.targetIndex) ||
    config.targetIndex < 0 ||
    config.targetIndex >= storedPatterns.length
  ) {
    throw new RangeError(
      `targetIndex ${config.targetIndex} is outside the stored pattern range.`,
    );
  }

  const target = storedPatterns[config.targetIndex];

  // Create noisy input from the actual target.
  const noisyInput = generateNoisyCopy(
    target.cells, config.noisePercent, config.seed + 1000,
  ).cells;

  // ============================================================
  // ACTUAL MEMORY ENGINE
  // ============================================================

  const weights = createWeightMatrix(
    storedPatterns.map((pattern) => [...pattern.cells]),
  );

  const startTime = performance.now();

  const engineResult = recall(
    weights,
    [...noisyInput],
    config.seed + 2000,
    {
        maxSweeps,
    },
);
  const recallTimeMs = performance.now() - startTime;

  // ============================================================
  // METRICS
  // ============================================================

  const metrics = buildRecallMetrics(
    engineResult.finalState,
    target,
    storedPatterns,
    {
      converged: engineResult.converged,
      sweepsExecuted: engineResult.sweepsExecuted,
    },
    maxSweeps,
    recallTimeMs,
  );

  return {
    experiment: "single-recall",

    seed: config.seed,

    targetPatternId: target.id,
    targetPatternName: target.name,

    patternCount: config.patternCount,
    noisePercent: config.noisePercent,

    metrics,
  };
}

/**
 * Run the noise experiment.
 *
 * Patterns remain fixed.
 * Only the amount of noise changes.
 */
export function runNoiseExperiment(
  seed: number,
  patternCount: number,
  targetIndex: number,
  noiseLevels: readonly number[],
  maxSweeps = DEFAULT_MAX_SWEEPS,
): RecallRun[] {
  const results: RecallRun[] = [];

  for (const noisePercent of noiseLevels) {
    results.push(
      runRecallExperiment({
        seed,
        patternCount,
        targetIndex,
        noisePercent,
        maxSweeps,
      }),
    );
  }

  return results.map((result) => ({
    ...result,
    experiment: "noise",
  }));
}

/**
 * Run the memory-load experiment.
 *
 * Generation method stays the same.
 * Number of stored patterns changes.
 */
export function runMemoryLoadExperiment(
  seed: number,
  patternCounts: readonly number[],
  targetIndex = 0,
  noisePercent = 20,
  maxSweeps = DEFAULT_MAX_SWEEPS,
): RecallRun[] {
  const results: RecallRun[] = [];

  for (const patternCount of patternCounts) {
    if (targetIndex >= patternCount) {
      continue;
    }

    results.push(
      runRecallExperiment({
        seed,
        patternCount,
        targetIndex,
        noisePercent,
        maxSweeps,
      }),
    );
  }

  return results.map((result) => ({
    ...result,
    experiment: "memory-load",
  }));
}

/**
 * Run all requested seeds and targets.
 */
export function runControlledExperiments(): {
  noise: RecallRun[];
  memoryLoad: RecallRun[];
} {
  const seeds = [11, 22, 33, 44, 55];

  const noiseLevels = [0, 10, 20, 30, 40, 50];

  const patternCounts = [1, 2, 4, 8, 12, 16];

  const noiseResults: RecallRun[] = [];
  const memoryResults: RecallRun[] = [];

  // ------------------------------------------------------------
  // NOISE EXPERIMENT
  // Same memory, different noise.
  // ------------------------------------------------------------

  for (const seed of seeds) {
    const patternCount = 4;

    for (let targetIndex = 0; targetIndex < patternCount; targetIndex += 1) {
      noiseResults.push(
        ...runNoiseExperiment(
          seed,
          patternCount,
          targetIndex,
          noiseLevels,
        ),
      );
    }
  }

  // ------------------------------------------------------------
  // MEMORY LOAD EXPERIMENT
  // Same generator + noise, increasing memory size.
  // ------------------------------------------------------------

  for (const seed of seeds) {
    for (const patternCount of patternCounts) {
      for (
        let targetIndex = 0;
        targetIndex < Math.min(patternCount, 4);
        targetIndex += 1
      ) {
        memoryResults.push(
          ...runMemoryLoadExperiment(
            seed,
            [patternCount],
            targetIndex,
            20,
          ),
        );
      }
    }
  }

  return {
    noise: noiseResults,
    memoryLoad: memoryResults,
  };
}

/**
 * Export a JSON-safe result.
 */
export function resultsToJson(
  results: ReturnType<typeof runControlledExperiments>,
): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),

      configuration: {
        cellCount: CELL_COUNT,
        seeds: [11, 22, 33, 44, 55],

        noiseExperiment: {
          patternCount: 4,
          noiseLevels: [0, 10, 20, 30, 40, 50],
        },

        memoryLoadExperiment: {
          patternCounts: [1, 2, 4, 8, 12, 16],
          noisePercent: 20,
          targetsPerLoad: 4,
        },

        maxSweeps: DEFAULT_MAX_SWEEPS,
      },

      sampleCounts: {
        noise: results.noise.length,
        memoryLoad: results.memoryLoad.length,
        total:
          results.noise.length +
          results.memoryLoad.length,
      },

      results,
    },
    null,
    2,
  );
}

export interface AggregateStats {
  totalRuns: number;
  exactRecalls: number;
  exactRecallRate: number;

  averageCellAccuracy: number;
  averageSweeps: number;
  averageRecallTimeMs: number;

  convergedRuns: number;
  iterationLimitRuns: number;
}

export interface SelectedExample {
  label: "selected-success" | "selected-failure";
  reason: string;

  experiment: string;
  seed: number;

  targetPatternId: string;
  targetPatternName: string;

  patternCount: number;
  noisePercent: number;

  metrics: RecallMetrics;
}

export interface ExperimentOutput {
  generatedAt: string;

  configuration: {
    cellCount: number;
    maxSweeps: number;

    seeds: number[];

    noiseExperiment: {
      patternCount: number;
      noiseLevels: number[];
      targetsPerSeed: number;
    };

    memoryLoadExperiment: {
      patternCounts: number[];
      noisePercent: number;
      targetsPerLoad: number;
    };
  };

  sampleCounts: {
    noise: number;
    memoryLoad: number;
    total: number;
  };

  aggregate: {
    noise: AggregateStats;
    memoryLoad: AggregateStats;
    overall: AggregateStats;
  };

  selectedExamples: {
    success: SelectedExample | null;
    failure: SelectedExample | null;
  };

  results: {
    noise: RecallRun[];
    memoryLoad: RecallRun[];
  };
}

/**
 * Calculate aggregate statistics for a collection of runs.
 */
export function calculateAggregateStats(
  results: readonly RecallRun[],
): AggregateStats {
  const totalRuns = results.length;

  if (totalRuns === 0) {
    return {
      totalRuns: 0,
      exactRecalls: 0,
      exactRecallRate: 0,
      averageCellAccuracy: 0,
      averageSweeps: 0,
      averageRecallTimeMs: 0,
      convergedRuns: 0,
      iterationLimitRuns: 0,
    };
  }

  const exactRecalls = results.filter(
    (result) => result.metrics.exactRecall,
  ).length;

  const convergedRuns = results.filter(
    (result) => result.metrics.converged,
  ).length;

  const iterationLimitRuns = results.filter(
    (result) => result.metrics.hitIterationLimit,
  ).length;

  const averageCellAccuracy =
    results.reduce(
      (sum, result) => sum + result.metrics.cellAccuracy,
      0,
    ) / totalRuns;

  const averageSweeps =
    results.reduce(
      (sum, result) => sum + result.metrics.sweeps,
      0,
    ) / totalRuns;

  const averageRecallTimeMs =
    results.reduce(
      (sum, result) => sum + result.metrics.recallTimeMs,
      0,
    ) / totalRuns;

  return {
    totalRuns,
    exactRecalls,
    exactRecallRate: exactRecalls / totalRuns,

    averageCellAccuracy,
    averageSweeps,
    averageRecallTimeMs,

    convergedRuns,
    iterationLimitRuns,
  };
}

/**
 * Select one strong success example.
 *
 * Preference:
 * 1. Exact recall
 * 2. Converged
 * 3. Fewer sweeps
 * 4. Deterministic configuration tie-break (timings vary by machine)
 */
function selectSuccessExample(
  results: readonly RecallRun[],
): SelectedExample | null {
  const successful = results.filter(
    (result) =>
      result.metrics.exactRecall &&
      result.metrics.converged,
  );

  if (successful.length === 0) {
    return null;
  }

  const sorted = [...successful].sort((a, b) => {
    if (a.metrics.sweeps !== b.metrics.sweeps) {
      return a.metrics.sweeps - b.metrics.sweeps;
    }

    return (
      a.seed - b.seed || a.patternCount - b.patternCount ||
      a.noisePercent - b.noisePercent || a.targetPatternId.localeCompare(b.targetPatternId)
    );
  });

  const selected = sorted[0];

  return {
    label: "selected-success",

    reason:
      "Exact recall with convergence; selected as a clean reliable success example.",

    experiment: selected.experiment,
    seed: selected.seed,

    targetPatternId: selected.targetPatternId,
    targetPatternName: selected.targetPatternName,

    patternCount: selected.patternCount,
    noisePercent: selected.noisePercent,

    metrics: selected.metrics,
  };
}

/**
 * Select one strong failure example.
 *
 * Preference:
 * 1. Not an exact recall
 * 2. Lowest cell accuracy
 * 3. Prefer runs that converged to the wrong state
 * 4. Then prefer runs hitting iteration limit
 */
function selectFailureExample(
  results: readonly RecallRun[],
): SelectedExample | null {
  const failures = results.filter(
    (result) => !result.metrics.exactRecall,
  );

  if (failures.length === 0) {
    return null;
  }

  const sorted = [...failures].sort((a, b) => {
    if (
      a.metrics.cellAccuracy !==
      b.metrics.cellAccuracy
    ) {
      return (
        a.metrics.cellAccuracy -
        b.metrics.cellAccuracy
      );
    }

    if (
      a.metrics.converged !==
      b.metrics.converged
    ) {
      return a.metrics.converged ? -1 : 1;
    }

    return (
      b.metrics.sweeps -
      a.metrics.sweeps
    );
  });

  const selected = sorted[0];

  return {
    label: "selected-failure",

    reason:
      "Failed exact recall; selected because it produced the lowest cell accuracy among measured runs.",

    experiment: selected.experiment,
    seed: selected.seed,

    targetPatternId: selected.targetPatternId,
    targetPatternName: selected.targetPatternName,

    patternCount: selected.patternCount,
    noisePercent: selected.noisePercent,

    metrics: selected.metrics,
  };
}

/**
 * Build the complete experiment output.
 */
export function buildExperimentOutput(
  results: ReturnType<typeof runControlledExperiments>,
): ExperimentOutput {
  const allResults = [
    ...results.noise,
    ...results.memoryLoad,
  ];

  return {
    generatedAt: new Date().toISOString(),

    configuration: {
      cellCount: CELL_COUNT,
      maxSweeps: DEFAULT_MAX_SWEEPS,

      seeds: [11, 22, 33, 44, 55],

      noiseExperiment: {
        patternCount: 4,
        noiseLevels: [0, 10, 20, 30, 40, 50],
        targetsPerSeed: 4,
      },

      memoryLoadExperiment: {
        patternCounts: [1, 2, 4, 8, 12, 16],
        noisePercent: 20,
        targetsPerLoad: 4,
      },
    },

    sampleCounts: {
      noise: results.noise.length,
      memoryLoad: results.memoryLoad.length,
      total: allResults.length,
    },

    aggregate: {
      noise: calculateAggregateStats(results.noise),

      memoryLoad: calculateAggregateStats(
        results.memoryLoad,
      ),

      overall: calculateAggregateStats(
        allResults,
      ),
    },

    selectedExamples: {
      success: selectSuccessExample(allResults),
      failure: selectFailureExample(allResults),
    },

    results: {
      noise: results.noise,
      memoryLoad: results.memoryLoad,
    },
  };
}

/**
 * Generate the final JSON document.
 */
export function generateExperimentJson(): string {
  const results = runControlledExperiments();

  const output = buildExperimentOutput(results);

  return JSON.stringify(
    output,
    null,
    2,
  );
}

