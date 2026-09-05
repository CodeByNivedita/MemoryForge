import { describe, expect, it } from 'vitest';
import { createWeightMatrix } from './hebbian';
import { recall } from './recall';

describe('recall', () => {
  it('recovers a stored bipolar pattern from a one-cell-damaged cue', () => {
    const pattern = Array.from({ length: 64 }, (_, index) =>
      index % 2 === 0 ? 1 : -1
    );
    const cue = [...pattern];
    cue[0] *= -1;

    const result = recall(createWeightMatrix([pattern]), cue, 42);

    expect(result.finalState).toEqual(pattern);
    expect(result.converged).toBe(true);
    expect(result.snapshots.length).toBe(result.sweepsExecuted);
  });

  it('returns copied snapshots rather than shared mutable state', () => {
    const pattern = Array(64).fill(1);
    const result = recall(createWeightMatrix([pattern]), pattern, 7);

    expect(result.finalState).not.toBe(pattern);
    expect(result.snapshots[0]).not.toBe(result.finalState);
  });
});
