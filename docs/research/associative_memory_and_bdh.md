# Associative memory and the BDH connection

## What MemoryForge implements

MemoryForge implements a classical Hopfield network with 64 bipolar neurons, not BDH. A stored picture is encoded in shared pairwise connection weights. A noisy cue can settle into a recognizable pattern, but recovery is not guaranteed.

For stored patterns ξᵖ, the implementation uses:

- Wᵢⱼ = (1/64) Σₚ ξᵢᵖ ξⱼᵖ for i ≠ j.
- Wᵢᵢ = 0; W is symmetric.
- hᵢ = Σⱼ Wᵢⱼ sⱼ.
- Update a single neuron: +1 if hᵢ > 0, −1 if hᵢ < 0, otherwise keep sᵢ.

Updates are **asynchronous**: later neurons read already-updated states. One sweep visits every neuron once. The seed selects a reproducible shuffled order. The engine stops after a complete unchanged sweep or the configured limit. It does not see the evaluation target.

## Energy and interpretation

E(s) = −½ Σᵢⱼ Wᵢⱼ sᵢ sⱼ.

With symmetric weights and zero diagonal, the implemented single-neuron rule cannot increase this energy. A lower energy is not proof of better target accuracy. Stable outputs may be the intended memory, another memory, an inverted memory, or an unlearned attractor. There is no guarantee of the nearest stored pattern or a global minimum.

Memories share weights, so adding patterns changes associations for every recall. Correlated shapes and balanced random patterns have different interference characteristics; fixed-seed measurements must retain their sample counts and conditions.

Animations display recorded states and weighted sums. Synapses do not learn or change during a Hopfield recall run. Graph highlights indicate the inspected connection or update, not a changing weight.

## A limited connection to BDH

The [BDH paper](https://arxiv.org/html/2509.26507v1), section 1.2, describes local reads and a Hebbian state update of the form σ(i,j) ← σ(i,j) + Y(i)X(j). The shared idea is an association stored through products of activity.

The architecture is not interchangeable with this demo. BDH includes learned parameters and evolving inference state, with sparse positive activities discussed in the paper. MemoryForge uses dense bipolar states and a fixed symmetric matrix during recall. Its energy argument must not be transferred to BDH.

The research page's two-dimensional read/write widget illustrates an outer-product update only. It is not BDH inference, training, a language model, or a reproduction of a reported benchmark.

## Primary references

- [Hopfield (1982), Neural networks and physical systems with emergent collective computational abilities](https://doi.org/10.1073/pnas.79.8.2554).
- [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain, arXiv:2509.26507](https://arxiv.org/html/2509.26507v1), especially section 1.2 and the discussion of sparse activations.
- [Official Pathway BDH repository](https://github.com/pathwaycom/bdh).

This project makes no claim to implement BDH-CQ, solve Sudoku, reproduce biological cognition, or reproduce the paper's performance.
