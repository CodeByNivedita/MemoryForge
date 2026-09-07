import { describe, expect, it } from 'vitest';
import { createWeightMatrix } from './hebbian';
import { networkEnergy, recall } from './recall';
import { generateNoisyCopy, generateRandomPatterns } from '../experiments';
import { runControlledExperiments } from '../experiments/run-evaluation';

describe('Recorded Hopfield computation', () => {
  const patterns = generateRandomPatterns(11, 4);
  const original = patterns[0].cells;
  const cue = generateNoisyCopy(original, 30, 1011).cells;
  const weights = createWeightMatrix(patterns.map((p) => [...p.cells]));
  it('stores symmetric normalized associations with no self connections', () => {
    for (let i = 0; i < 64; i++) {
      expect(weights[i][i]).toBe(0);
      for (let j = 0; j < 64; j++) {
        expect(weights[i][j]).toBe(weights[j][i]);
        if (i !== j)
          expect(weights[i][j]).toBe(
            patterns.reduce((s, p) => s + (p.cells[i] * p.cells[j]) / 64, 0)
          );
      }
    }
  });
  it('records the actual sequential updates and non-increasing energy', () => {
    const result = recall(weights, [...cue], 2011, { captureUpdates: true });
    let before = [...cue] as number[];
    let energy = networkEnergy(weights, before);
    for (const update of result.updates) {
      const input = weights[update.neuron].reduce(
        (s, w, j) => s + w * before[j],
        0
      );
      expect(update.previousState).toBe(before[update.neuron]);
      expect(update.weightedInput).toBe(input);
      expect(update.newState).toBe(
        input > 0 ? 1 : input < 0 ? -1 : before[update.neuron]
      );
      const expected = [...before];
      expected[update.neuron] = update.newState;
      expect(update.state).toEqual(expected);
      const nextEnergy = networkEnergy(weights, update.state);
      expect(nextEnergy).toBeLessThanOrEqual(energy + 1e-10);
      before = update.state;
      energy = nextEnergy;
    }
    expect(before).toEqual(result.finalState);
    expect(result.updates).toHaveLength(result.sweepsExecuted * 64);
    expect(result.energies).toHaveLength(result.snapshots.length + 1);
    result.snapshots.forEach((snapshot, i) => {
      expect(snapshot).toEqual(result.updates[(i + 1) * 64 - 1].state);
      expect(result.energies[i + 1]).toBe(networkEnergy(weights, snapshot));
    });
  });
  it('instrumentation does not change results or mutate inputs', () => {
    const saved = JSON.stringify({ weights, cue, original });
    const plain = recall(weights, [...cue], 2011);
    const recorded = recall(weights, [...cue], 2011, { captureUpdates: true });
    expect(recorded.finalState).toEqual(plain.finalState);
    expect(recorded.snapshots).toEqual(plain.snapshots);
    expect(recall(weights, [...cue], 2011, { captureUpdates: true })).toEqual(
      recorded
    );
    expect(JSON.stringify({ weights, cue, original })).toBe(saved);
    recorded.finalState[0] *= -1;
    expect(recorded.snapshots[recorded.snapshots.length - 1]).not.toEqual(
      recorded.finalState
    );
  });
  it('keeps state on zero input and requires a complete unchanged sweep', () => {
    const result = recall(createWeightMatrix([]), [...cue], 1, {
      captureUpdates: true,
    });
    expect(result.finalState).toEqual(cue);
    expect(result.sweepsExecuted).toBe(1);
    expect(result.converged).toBe(true);
    expect(
      result.updates.every(
        (u) => u.weightedInput === 0 && u.newState === u.previousState
      )
    ).toBe(true);
  });
  it('rejects invalid computation inputs', () => {
    for (const maxSweeps of [0, -1, 1.5, Infinity, 1001]) {
      expect(() => recall(weights, [...cue], 1, { maxSweeps })).toThrow();
    }
    expect(() => recall(weights, [1])).toThrow();
    expect(() => recall(weights, Array(64).fill(NaN))).toThrow();
  });
  it('noise is a reproducible separate copy with exactly rounded distinct flips', () => {
    const noisy = generateNoisyCopy(original, 20, 42);
    expect(noisy.flippedPixels).toBe(13);
    expect(noisy.cells.filter((v, i) => v !== original[i])).toHaveLength(13);
    expect(noisy.cells).not.toBe(original);
    expect(generateNoisyCopy(original, 20, 42)).toEqual(noisy);
    expect(generateNoisyCopy(original, 0, 42).cells).toEqual(original);
  });
  it('the guided lesson demonstrates a measured success and interference failure', () => {
    const run = runControlledExperiments().memoryLoad.find(
      (r) => r.patternCount === 16 && !r.metrics.exactRecall
    )!;
    expect(run).toBeDefined();
    const bank = generateRandomPatterns(run.seed, 16);
    const target = bank.find((p) => p.id === run.targetPatternId)!;
    const noisy = generateNoisyCopy(target.cells, 20, run.seed + 1000).cells;
    const compute = (count: number) =>
      recall(
        createWeightMatrix(bank.slice(0, count).map((p) => [...p.cells])),
        [...noisy],
        run.seed + 2000,
        { maxSweeps: 50 }
      );
    expect(compute(4).finalState).toEqual(target.cells);
    expect(compute(16).finalState).not.toEqual(target.cells);
  });
});
