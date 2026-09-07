import { useMemo } from "react";
import {
  runControlledExperiments,
  calculateAggregateStats,
  buildExperimentOutput,
  type RecallRun,
} from "../../experiments/run-evaluation";
import { generateRandomPattern, generateNoisyCopy } from "../../experiments";
import type { LabScenario, StoredPattern } from "../lab/patterns";
import { BarChart } from "./charts/barchart";
import { downloadJson } from "../../../utils/download/download";


const panel = "rounded-xl border border-slate-200 bg-white p-5 sm:p-6";
const heading = "text-base font-semibold tracking-tight text-slate-900";

interface Bucket {
  readonly key: number;
  readonly n: number;
  readonly exactRecalls: number;
  readonly exactRecallRate: number;
  readonly averageCellAccuracy: number;
  readonly averageSweeps: number;
}

function bucketStats(
  runs: readonly RecallRun[],
  key: "noisePercent" | "patternCount",
): Bucket[] {
  const groups = new Map<number, RecallRun[]>();

  for (const run of runs) {
    const k = run[key];
    const existing = groups.get(k);
    if (existing) {
      existing.push(run);
    } else {
      groups.set(k, [run]);
    }
  }

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, rs]) => {
      const exact = rs.filter((r) => r.metrics.exactRecall).length;
      return {
        key: k,
        n: rs.length,
        exactRecalls: exact,
        exactRecallRate: exact / rs.length,
        averageCellAccuracy:
          rs.reduce((sum, r) => sum + r.metrics.cellAccuracy, 0) / rs.length,
        averageSweeps:
          rs.reduce((sum, r) => sum + r.metrics.sweeps, 0) / rs.length,
      };
    });
}

function mostReliable(buckets: readonly Bucket[]): Bucket {
  return [...buckets].sort(
    (a, b) => b.exactRecallRate - a.exactRecallRate || b.key - a.key,
  )[0];
}

function leastReliable(buckets: readonly Bucket[]): Bucket {
  return [...buckets].sort(
    (a, b) => a.exactRecallRate - b.exactRecallRate || a.key - b.key,
  )[0];
}

/** Same seeding scheme as run-evaluation.ts's private createStoredPatterns(). */
function createStoredPatterns(seed: number, count: number): StoredPattern[] {
  const patterns: StoredPattern[] = [];
  for (let i = 0; i < count; i += 1) {
    const pattern = generateRandomPattern(seed + i);
    patterns.push({ id: pattern.id, name: pattern.name, cells: pattern.cells });
  }
  return patterns;
}

/** Pick one representative, reproducible run from a noise-level bucket. */
function representativeRun(
  runs: readonly RecallRun[],
  noisePercent: number,
  exactRecall: boolean,
): RecallRun {
  const candidates = runs.filter((r) => r.noisePercent === noisePercent && r.metrics.exactRecall === exactRecall);
  return [...candidates].sort(
    (a, b) => a.seed - b.seed || a.targetPatternId.localeCompare(b.targetPatternId),
  )[0];
}

interface PresetCardProps {
  readonly kind: "success" | "failure";
  readonly bucket: Bucket;
  readonly run: RecallRun;
  readonly onLoad: () => void;
}

function PresetCard({ kind, bucket, run, onLoad }: PresetCardProps) {
  const isSuccess = kind === "success";

  return (
    <div
      className={`rounded-lg border p-4 ${isSuccess ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${isSuccess ? "text-emerald-700" : "text-rose-700"}`}
      >
        {isSuccess ? "Measured success preset" : "Measured failure preset"}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {run.patternCount} stored patterns, {run.noisePercent}% noise on the
        cue — <strong>{(bucket.exactRecallRate * 100).toFixed(0)}%</strong>{" "}
        exact recall across every sampled seed and target at this
        configuration ({bucket.exactRecalls}/{bucket.n}).
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Sample run shown: seed {run.seed}, target {run.targetPatternName}.
      </p>

      <button
        type="button"
        onClick={onLoad}
        className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-white ${isSuccess ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"}`}
      >
        Load into Pattern Lab
      </button>
    </div>
  );
}

interface ExperimentDashboardProps {
  readonly onLoadScenario: (scenario: LabScenario) => void;
}

export function ExperimentDashboard({
  onLoadScenario,
}: ExperimentDashboardProps) {
  const data = useMemo(() => {
    const results = runControlledExperiments();
    const all = [...results.noise, ...results.memoryLoad];

    return {
      results,
      all,
      noiseBuckets: bucketStats(results.noise, "noisePercent"),
      loadBuckets: bucketStats(results.memoryLoad, "patternCount"),
      aggregate: {
        noise: calculateAggregateStats(results.noise),
        memoryLoad: calculateAggregateStats(results.memoryLoad),
        overall: calculateAggregateStats(all),
      },
    };
  }, []);

  const successBucket = mostReliable(data.noiseBuckets);
  const failureBucket = leastReliable(data.noiseBuckets);
  const successRun = representativeRun(data.results.noise, successBucket.key, true);
  const failureRun = representativeRun(data.results.noise, failureBucket.key, false);

  function loadPreset(run: RecallRun) {
    const stored = createStoredPatterns(run.seed, run.patternCount);
    const target = stored.find((pattern) => pattern.id === run.targetPatternId);
    if (!target) throw new Error("Experiment target is missing from its memory bank.");

    const cue =
      run.noisePercent > 0
        ? generateNoisyCopy(target.cells, run.noisePercent, run.seed + 1000)
            .cells
        : target.cells;

    onLoadScenario({
      stored,
      selectedId: target.id,
      cue,
      recallSeed: run.seed + 2000,
      noiseSeed: run.seed + 1000,
      maxSweeps: run.metrics.maxSweeps,
      label: `${run.patternCount}-pattern / ${run.noisePercent}% noise ${
        run.metrics.exactRecall ? "success" : "failure"
      } preset (seed ${run.seed})`,
    });
  }

  function exportResults() {
    downloadJson("memoryforge-experiment-results.json", {
      generatedAt: new Date().toISOString(),
      configuration: buildExperimentOutput(data.results).configuration,
      seeding: { pattern: "seed + pattern index", noise: "seed + 1000", recall: "seed + 2000" },
      description:
        "Controlled experiments on the MemoryForge Hopfield-style associative memory: patterns fixed with increasing noise, and generation method fixed with increasing memory load.",
      sampleCounts: {
        noise: data.results.noise.length,
        memoryLoad: data.results.memoryLoad.length,
        total: data.all.length,
      },
      aggregate: data.aggregate,
      breakdown: {
        noiseExperiment_byNoisePercent: data.noiseBuckets,
        memoryLoadExperiment_byPatternCount: data.loadBuckets,
      },
      selectedExamples: {
        success: { config: successBucket, run: successRun },
        failure: { config: failureBucket, run: failureRun },
      },
      results: data.results,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* SUMMARY */}
      <section className={panel} aria-labelledby="dashboard-summary-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="dashboard-summary-heading" className={heading}>
            Experiment dashboard
          </h2>

          <span className="text-sm tabular-nums text-slate-500">
            {data.all.length} runs · {data.aggregate.overall.exactRecalls}{" "}
            exact recalls ({(data.aggregate.overall.exactRecallRate * 100).toFixed(1)}%)
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          Two controlled experiments run live in your browser, using the
          project's real Hebbian learning rule and asynchronous Hopfield
          recall — the same engine as the Pattern Lab. Five seeds
          (11, 22, 33, 44, 55), all four targets per seed in the noise experiment,
          and up to four targets per load in the memory-load experiment. Each
          run allows at most 50 sweeps.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Noise experiment</p>
            <p className="mt-1 text-lg font-semibold">
              {data.aggregate.noise.exactRecallRate * 100 | 0}% exact
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {data.aggregate.noise.totalRuns} runs, patterns fixed
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Memory-load experiment</p>
            <p className="mt-1 text-lg font-semibold">
              {data.aggregate.memoryLoad.exactRecallRate * 100 | 0}% exact
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {data.aggregate.memoryLoad.totalRuns} runs, generator fixed
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Overall</p>
            <p className="mt-1 text-lg font-semibold">
              {data.aggregate.overall.averageCellAccuracy.toFixed(3)} avg
              accuracy
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {data.aggregate.overall.convergedRuns}/
              {data.aggregate.overall.totalRuns} converged
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportResults}
          className="mt-5 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export full results (JSON)
        </button>
      </section>

      {/* CHARTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panel} aria-labelledby="noise-chart-heading">
          <h3 id="noise-chart-heading" className="mb-1 text-sm font-semibold">
            Noise ↑, patterns fixed (4 stored)
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Exact recall rate by cue noise level
          </p>

          <BarChart
            maxValue={1}
            ariaLabel="Exact recall rate by noise percent"
            data={data.noiseBuckets.map((b) => ({
              label: `${b.key}%`,
              value: b.exactRecallRate,
              detail: `(n=${b.n})`,
            }))}
          />
        </section>

        <section className={panel} aria-labelledby="load-chart-heading">
          <h3 id="load-chart-heading" className="mb-1 text-sm font-semibold">
            Memory load ↑, generator fixed (20% noise)
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Exact recall rate by number of stored patterns
          </p>

          <BarChart
            maxValue={1}
            ariaLabel="Exact recall rate by pattern count"
            data={data.loadBuckets.map((b) => ({
              label: `${b.key}`,
              value: b.exactRecallRate,
              detail: `(n=${b.n})`,
            }))}
          />
        </section>
      </div>

      {/* SELECTED EXAMPLES */}
      <section className={panel} aria-labelledby="selected-examples-heading">
        <h3 id="selected-examples-heading" className="mb-1 text-sm font-semibold">
          Selected examples for the guided demo
        </h3>
        <p className="mb-4 text-xs text-slate-500">
          Measured examples from the strongest and weakest noise configurations.
          Rates describe these sampled runs, not a guarantee for new patterns.
          Loading a preset replaces the lab memory bank and preserves its recall settings.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <PresetCard
            kind="success"
            bucket={successBucket}
            run={successRun}
            onLoad={() => loadPreset(successRun)}
          />
          <PresetCard
            kind="failure"
            bucket={failureBucket}
            run={failureRun}
            onLoad={() => loadPreset(failureRun)}
          />
        </div>
      </section>
    </div>
  );
}
