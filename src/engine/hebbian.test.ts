import { describe, expect, it } from "vitest";
import { createWeightMatrix } from "./hebbian";

describe("createWeightMatrix", () => {
    it("creates a 64x64 weight matrix", () => {
        const pattern = Array(64).fill(1);

        const weights = createWeightMatrix([pattern]);

        expect(weights).toHaveLength(64);

        for (const row of weights) {
            expect(row).toHaveLength(64);
        }
    });

    it("keeps all diagonal weights equal to zero", () => {
        const pattern = Array(64).fill(1);

        const weights = createWeightMatrix([pattern]);

        for (let i = 0; i < 64; i++) {
            expect(weights[i][i]).toBe(0);
        }
    });

    it("creates a symmetric weight matrix", () => {
        const pattern = Array.from(
            { length: 64 },
            (_, index) => (index % 2 === 0 ? 1 : 0)
        );

        const weights = createWeightMatrix([pattern]);

        for (let i = 0; i < 64; i++) {
            for (let j = 0; j < 64; j++) {
                expect(weights[i][j]).toBe(weights[j][i]);
            }
        }
    });

    it("calculates Hebbian weights correctly", () => {
        const pattern = Array(64).fill(0);

        pattern[0] = 1; // +1
        pattern[1] = 1; // +1
        pattern[2] = 0; // -1

        const weights = createWeightMatrix([pattern]);

        // W[0][1] = (+1 * +1) / 64
        expect(weights[0][1]).toBeCloseTo(1 / 64);

        // W[0][2] = (+1 * -1) / 64
        expect(weights[0][2]).toBeCloseTo(-1 / 64);

        // Diagonal must always be zero
        expect(weights[0][0]).toBe(0);
    });
});