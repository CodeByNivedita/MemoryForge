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
  if (metrics.exactRecall) {
    return `Recall succeeded — the network settled exactly on "${targetName}".`;
  }

  const sorted = [...metrics.overlaps].sort(
    (a, b) => b.cellAccuracy - a.cellAccuracy,
  );
  const best = sorted[0];

  if (!best) {
    return "No stored patterns were available to compare against.";
  }

  if (best.patternId === targetPatternId) {
    return (
      `Close, but not exact: the network settled ${(best.cellAccuracy * 100).toFixed(1)}% ` +
      `of the way to "${targetName}" and stopped there instead of converging the rest of ` +
      `the way — the cue was too corrupted, or too many other memories are competing ` +
      `for the same neurons.`
    );
  }

  if (best.cellAccuracy >= 0.8) {
    return (
      `Crosstalk: the network converged to a state that closely resembles a different ` +
      `stored memory, "${best.patternName}" (${(best.cellAccuracy * 100).toFixed(1)}% match), ` +
      `instead of the target "${targetName}". This happens when stored patterns overlap too ` +
      `much for the network to tell them apart.`
    );
  }

  return (
    `Spurious state: the output doesn't closely match any stored pattern (best match is ` +
    `"${best.patternName}" at ${(best.cellAccuracy * 100).toFixed(1)}%). This is the classic ` +
    `Hopfield failure mode — too much noise or too many stored patterns pushed the network ` +
    `into a stable state that was never actually stored.`
  );
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