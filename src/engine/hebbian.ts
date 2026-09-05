const NEURON_COUNT = 64;

function toBipolar(pattern: number[]): number[] {
    return pattern.map((value) => (value > 0 ? 1 : -1));
}

export function createWeightMatrix(patterns: number[][]): number[][] {
    // Create empty 64x64 matrix
    const weights: number[][] = Array.from(
        { length: NEURON_COUNT },
        () => Array(NEURON_COUNT).fill(0)
    );

    // Store every pattern
    for (const pattern of patterns) {
        if (pattern.length !== NEURON_COUNT) {
            throw new Error(
                `Each pattern must contain exactly ${NEURON_COUNT} values.`
            );
        }

        // Convert to bipolar representation
        const bipolarPattern = toBipolar(pattern);

        // Hebbian learning rule
        for (let i = 0; i < NEURON_COUNT; i++) {
            for (let j = 0; j < NEURON_COUNT; j++) {
                weights[i][j] +=
                    (bipolarPattern[i] * bipolarPattern[j]) /
                    NEURON_COUNT;
            }
        }
    }

    // A neuron should not connect to itself
    for (let i = 0; i < NEURON_COUNT; i++) {
        weights[i][i] = 0;
    }

    return weights;
}