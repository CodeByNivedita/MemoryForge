import { createWeightMatrix } from './hebbian';
import type { StoredPattern } from '../components/lab/patterns';

export function storageFrame(
  patterns: readonly StoredPattern[],
  rows: number
): number[][] {
  const previous = createWeightMatrix(
    patterns.slice(0, -1).map((p) => [...p.cells])
  );
  const pattern = patterns[patterns.length - 1];
  if (!pattern) return previous;
  for (let i = 0; i < Math.min(64, Math.max(0, rows)); i++) {
    for (let j = i + 1; j < 64; j++) {
      const delta = (pattern.cells[i] * pattern.cells[j]) / 64;
      previous[i][j] += delta;
      previous[j][i] += delta;
    }
  }
  return previous;
}
