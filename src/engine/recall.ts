const NEURON_COUNT = 64;
const DEFAULT_MAX_SWEEPS = 100;

export interface RecallSettings {
    maxSweeps?: number;
}

export interface RecallResult {
    finalState: number[];
    snapshots: number[][];
    converged: boolean;
    sweepsExecuted: number;
}

function toBipolar(pattern: number[]): number[] {
    return pattern.map((value) => (value > 0 ? 1 : -1));
}


function normalizeSeed(seed: number | string): number {
    if (typeof seed === "number") {
        return seed >>> 0;
    }
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
}

function createPRNG(seed: number) {
    let s = seed >>> 0;
    return function (): number {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}


function getUpdateOrder(neuronCount: number, rng?: () => number): number[] {
    const order = Array.from({ length: neuronCount }, (_, i) => i);
    if (!rng) {
        return order;
    }
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = order[i];
        order[i] = order[j];
        order[j] = temp;
    }
    return order;
}

/**
 * Recovers a memory state asynchronously using Hopfield neural network recall rules.
 *
 * @param weights 64x64 learned weight matrix
 * @param damagedCue Initial 64-element pattern cue
 * @param seed Optional seed controlling the deterministic update order
 * @param settings Optional recall settings (e.g. maxSweeps)
 */
export function recall(
    weights: number[][],
    damagedCue: number[],
    seed?: number | string | null,
    settings?: RecallSettings
): RecallResult {
    if (damagedCue.length !== NEURON_COUNT) {
        throw new Error(
            `Damaged cue must contain exactly ${NEURON_COUNT} values.`
        );
    }

    if (weights.length !== NEURON_COUNT) {
        throw new Error(`Weight matrix must have ${NEURON_COUNT} rows.`);
    }

    for (let i = 0; i < NEURON_COUNT; i++) {
        if (weights[i].length !== NEURON_COUNT) {
            throw new Error(
                `Weight matrix row ${i} must contain ${NEURON_COUNT} columns.`
            );
        }
    }

    const maxSweeps = settings?.maxSweeps ?? DEFAULT_MAX_SWEEPS;
    const state = toBipolar(damagedCue);
    const snapshots: number[][] = [];

    const rng =
        seed !== undefined && seed !== null
            ? createPRNG(normalizeSeed(seed))
            : undefined;

    let converged = false;
    let sweepsExecuted = 0;

    for (let sweep = 0; sweep < maxSweeps; sweep++) {
        sweepsExecuted++;
        let changedInSweep = false;
        const order = getUpdateOrder(NEURON_COUNT, rng);

        for (const i of order) {
            let weightedInput = 0;
            for (let j = 0; j < NEURON_COUNT; j++) {
                weightedInput += weights[i][j] * state[j];
            }

            let newState = state[i];
            if (weightedInput > 0) {
                newState = 1;
            } else if (weightedInput < 0) {
                newState = -1;
            }

            if (newState !== state[i]) {
                state[i] = newState;
                changedInSweep = true;
            }
        }

        snapshots.push([...state]);

        if (!changedInSweep) {
            converged = true;
            break;
        }
    }

    return {
        finalState: [...state],
        snapshots,
        converged,
        sweepsExecuted,
    };
}
