/** Camera-only geometry: neuron identity and network mathematics never depend on position. */
export function projectNeurons(rotation: number, spatial: boolean) {
  return Array.from({ length: 64 }, (_, i) => {
    if (!spatial) {
      return {
        i,
        x: 106 + (i % 8) * 44,
        y: 36 + Math.floor(i / 8) * 44,
        z: 0,
        scale: 1,
      };
    }
    const y = 1 - (2 * (i + 0.5)) / 64;
    const radius = Math.sqrt(1 - y * y);
    const a = i * Math.PI * (3 - Math.sqrt(5)) + rotation;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const scale = 1 / (1 - z * 0.22);
    return { i, x: 260 + x * 143 * scale, y: 190 + y * 143 * scale, z, scale };
  });
}
