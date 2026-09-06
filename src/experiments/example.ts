import {
  VISUAL_PATTERNS,
  generateNoisyCopy,
  generateRandomPattern,
} from "./index";

// Load an experiment pattern.
const cross = VISUAL_PATTERNS.find(
  (pattern) => pattern.id === "visual-cross",
);

if (!cross) {
  throw new Error("Cross pattern not found.");
}

// Generate a reproducible 25% noisy copy.
const noisyCross = generateNoisyCopy(
  cross.cells,
  25,
  42,
);

console.log("Original pattern:", cross);
console.log("Noisy copy:", noisyCross);

// Generate a reproducible balanced random pattern.
const randomPattern = generateRandomPattern(123);

console.log("Random pattern:", randomPattern);