import { describe, expect, it } from 'vitest';
import { storageFrame } from './storageTrace';
import { createWeightMatrix } from './hebbian';
import { generateRandomPatterns } from '../experiments';

describe('Weight learning replay', () => {
  const patterns = generateRandomPatterns(11, 4);
  it('starts from the previous bank and ends at the exact learned matrix', () => {
    expect(storageFrame(patterns, 0)).toEqual(
      createWeightMatrix(patterns.slice(0, -1).map((p) => [...p.cells]))
    );
    expect(storageFrame(patterns, 64)).toEqual(
      createWeightMatrix(patterns.map((p) => [...p.cells]))
    );
    expect(storageFrame([], 64)).toEqual(createWeightMatrix([]));
  });
  it('adds each pair once, preserving symmetry and zero diagonal at every frame', () => {
    const base = storageFrame(patterns, 0);
    const last = patterns[patterns.length - 1].cells;
    for (let row = 0; row <= 64; row++) {
      const frame = storageFrame(patterns, row);
      for (let i = 0; i < 64; i++) {
        expect(frame[i][i]).toBe(0);
        for (let j = i + 1; j < 64; j++) {
          expect(frame[i][j]).toBe(
            base[i][j] + (i < row ? (last[i] * last[j]) / 64 : 0)
          );
          expect(frame[i][j]).toBe(frame[j][i]);
        }
      }
    }
  });
  it('does not mutate the patterns or reuse a mutable matrix', () => {
    const before = JSON.stringify(patterns);
    const matrix = storageFrame(patterns, 32);
    matrix[0][1] = 999;
    expect(storageFrame(patterns, 32)[0][1]).not.toBe(999);
    expect(JSON.stringify(patterns)).toBe(before);
  });
});
