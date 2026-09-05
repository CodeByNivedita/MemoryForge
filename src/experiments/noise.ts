import { assertPattern } from '../components/lab/patterns';
import type { Cell, PatternCells } from '../components/lab/patterns';

function seedValue(seed: number | string): number {
  if (typeof seed === 'number') return seed >>> 0;
  let value = 2166136261;
  for (const character of seed)
    value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

function randomGenerator(seed: number | string): () => number {
  let state = seedValue(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function addNoise(
  pattern: PatternCells,
  percentage: number,
  seed: number | string
): Cell[] {
  assertPattern(pattern);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError('Noise percentage must be between 0 and 100.');
  }
  const result = [...pattern];
  const indices = Array.from({ length: pattern.length }, (_, index) => index);
  const random = randomGenerator(seed);
  for (let index = indices.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }
  const flipCount = Math.round((percentage / 100) * pattern.length);
  for (let index = 0; index < flipCount; index++) {
    const cellIndex = indices[index];
    result[cellIndex] = result[cellIndex] === 1 ? -1 : 1;
  }
  return result;
}
