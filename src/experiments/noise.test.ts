import { describe, expect, it } from 'vitest';
import { addNoise } from './noise';
import type { Cell } from '../components/lab/patterns';

describe('addNoise', () => {
  it('flips the requested number of cells reproducibly without mutating the original', () => {
    const original: Cell[] = Array.from({ length: 64 }, (_, index) =>
      index % 2 === 0 ? 1 : -1
    );
    const before = [...original];
    const first = addNoise(original, 25, 'same-seed');
    const second = addNoise(original, 25, 'same-seed');

    expect(first).toEqual(second);
    expect(
      first.filter((cell, index) => cell !== original[index])
    ).toHaveLength(16);
    expect(original).toEqual(before);
  });

  it('rejects percentages outside the supported range', () => {
    const pattern = Array<Cell>(64).fill(-1);
    expect(() => addNoise(pattern, -1, 1)).toThrow(RangeError);
    expect(() => addNoise(pattern, 101, 1)).toThrow(RangeError);
  });
});
