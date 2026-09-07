import type { RecallMetrics } from "../../experiments";

interface FailureAnalysisProps {
  readonly metrics: RecallMetrics;
  readonly targetPatternId: string;
  readonly targetName: string;
}

function diagnose(
  metrics: RecallMetrics,
  targetPatternId: string,
  targetName: string,
): string {
  if (!metrics.converged) {
    return `Recall stopped after ${metrics.sweeps} sweeps without confirmed convergence. ` +
      `The final output matches ${(metrics.cellAccuracy * 100).toFixed(1)}% of the target's cells; ` +
      "it is not yet a confirmed stable memory.";
  }
  if (metrics.exactRecall) {
    return `Recall succeeded — the network settled exactly on "${targetName}".`;
  }

  const best = [...metrics.overlaps].sort(
    (a, b) => b.cellAccuracy - a.cellAccuracy,
  )[0];
  if (!best) return "No stored patterns were available to compare against.";

  if (best.cellAccuracy === 1 && best.patternId !== targetPatternId) {
    return `The network settled on a different stored memory, "${best.patternName}", instead of "${targetName}".`;
  }

  const inverted = metrics.overlaps.find((pattern) => pattern.overlap === -1);
  if (inverted) {
    return `The network settled on the exact inverse of "${inverted.patternName}" (every cell flipped), ` +
      `not the intended target "${targetName}". Hebbian weights are unchanged when all cells ` +
      "of a stored pattern change sign, so an inverted memory can also be a stable state.";
  }

  return `The network settled at a state that was not stored. Its nearest stored pattern is ` +
    `"${best.patternName}" (${(best.cellAccuracy * 100).toFixed(1)}% matching cells). ` +
    "This is a spurious fixed point. Cue noise and interference between memories can contribute, " +
    "but these metrics alone do not establish the cause.";
}

export function FailureAnalysis({
  metrics,
  targetPatternId,
  targetName,
}: FailureAnalysisProps) {
  const sorted = [...metrics.overlaps].sort(
    (a, b) => b.cellAccuracy - a.cellAccuracy,
  );

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold">
        {metrics.exactRecall ? "Recall analysis" : "Failure analysis"}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {diagnose(metrics, targetPatternId, targetName)}
      </p>

      {sorted.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Overlap with every stored pattern
          </p>

          <ul className="flex flex-col gap-1.5">
            {sorted.map((overlap) => (
              <li
                key={overlap.patternId}
                className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-slate-700">
                  {overlap.patternName}
                  {overlap.patternId === targetPatternId && (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      target
                    </span>
                  )}
                </span>

                <span className="shrink-0 tabular-nums text-slate-500">
                  {(overlap.cellAccuracy * 100).toFixed(1)}% ·{" "}
                  overlap {overlap.overlap.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}