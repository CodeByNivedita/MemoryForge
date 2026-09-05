import {
  CELL_COUNT,
  type Cell,
  type PatternCells,
} from "./pattern";

export interface NoisyPattern {
  readonly cells: PatternCells;
  readonly flipPercentage: number;
  readonly flippedPixels: number;
  readonly seed: number;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;

    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a noisy copy by flipping a requested percentage
 * of the original pattern's pixels.
 *
 * Same pattern + percentage + seed => same noisy copy.
 */
export function generateNoisyCopy(
  pattern: PatternCells,
  flipPercentage: number,
  seed: number,
): NoisyPattern {
  if (pattern.length !== CELL_COUNT) {
    throw new RangeError(
      "Pattern must contain exactly 64 cells.",
    );
  }

  if (pattern.some((cell) => cell !== -1 && cell !== 1)) {
    throw new RangeError(
      "Pattern cells must be either -1 or +1.",
    );
  }

  if (
    !Number.isFinite(flipPercentage) ||
    flipPercentage < 0 ||
    flipPercentage > 100
  ) {
    throw new RangeError(
      "Flip percentage must be between 0 and 100.",
    );
  }

  const cells: Cell[] = [...pattern];

  const pixelsToFlip = Math.round(
    (CELL_COUNT * flipPercentage) / 100,
  );

  const random = seededRandom(seed);

  const indices = Array.from(
    { length: CELL_COUNT },
    (_, index) => index,
  );

  // Select pixels deterministically.
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));

    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < pixelsToFlip; i += 1) {
    const index = indices[i];

    cells[index] = cells[index] === 1 ? -1 : 1;
  }

  return Object.freeze({
    cells: Object.freeze(cells),
    flipPercentage,
    flippedPixels: pixelsToFlip,
    seed,
  });
}