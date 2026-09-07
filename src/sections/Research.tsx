import { useState } from 'react';

const paper = 'https://arxiv.org/html/2509.26507v1';
export function Research() {
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.5);
  const [matrix, setMatrix] = useState([0, 0, 0, 0]);
  const [writes, setWrites] = useState(0);
  return (
    <div className="mx-auto max-w-5xl py-10">
      <p className="eyebrow">The research connection</p>
      <h1 className="page-title mt-2 max-w-3xl">From Hopfield to BDH.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
        Our lab teaches associative memory. It is a stepping stone to
        understanding connection-based state—not a reproduction of Pathway’s
        Dragon Hatchling (BDH).
      </p>
      <section className="surface-panel mt-8 grid gap-8 p-6 sm:p-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">
            When connections carry state
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            BDH distinguishes parameters learned in training from evolving
            connection state during inference. Its local Hebbian rule reinforces
            associations through co-activation. Our Hopfield lab instead writes
            patterns before recall, then keeps those weights fixed.
          </p>
          <a
            className="mt-4 inline-block text-sm text-blue-800 underline underline-offset-4"
            href={paper + '#S1.SS2'}
            target="_blank"
            rel="noreferrer"
          >
            BDH paper · §1.2, equations 1–2 ↗
          </a>
        </div>
        <div className="rounded-xl bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Simplified read / write loop
          </p>
          <ol className="mt-4 space-y-3 text-sm">
            <li>
              <strong>01 · Activate</strong> — signals X and Y
            </li>
            <li>
              <strong>02 · Write</strong> — σᵢⱼ ← σᵢⱼ + YᵢXⱼ
            </li>
            <li>
              <strong>03 · Read</strong> — use connection state in signal
              propagation
            </li>
          </ol>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            The full architecture also includes learned parameters,
            nonlinearities, and scheduled dynamics.
          </p>
        </div>
      </section>
      <section className="surface-panel mt-6 p-6 sm:p-8">
        <div className="flex flex-wrap justify-between gap-3">
          <h2 className="text-xl font-semibold">Try one small Hebbian write</h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-900">
            Illustration only · not BDH inference
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This two-by-two matrix starts at zero. Set X = [1, x] and Y = [y, 1],
          then add the outer product YXᵀ. The read below is ordinary matrix
          multiplication with a fixed query [1, 0]; it illustrates storage and
          retrieval, not the full architecture.
        </p>
        <div className="mt-6 grid items-center gap-8 md:grid-cols-3">
          <div className="space-y-5">
            {[
              ['x', x, setX],
              ['y', y, setY],
            ].map(([name, value, setter]) => (
              <label key={name as string} className="block text-sm font-medium">
                {name as string} = {Number(value).toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.25"
                  value={value as number}
                  onChange={(e) =>
                    (setter as (n: number) => void)(Number(e.target.value))
                  }
                  className="mt-3 block w-full accent-teal-700"
                />
              </label>
            ))}
            <button
              onClick={() => {
                setMatrix((m) => m.map((v, i) => v + [y, y * x, 1, x][i]));
                setWrites((n) => n + 1);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Apply a write
            </button>
          </div>
          <div>
            <p className="mb-3 text-sm text-slate-500">
              Connection state σ · {writes} writes
            </p>
            <div className="grid grid-cols-2 gap-2">
              {matrix.map((v, i) => (
                <output
                  key={i}
                  className="rounded-lg border border-teal-100 bg-teal-50 p-5 text-center font-mono text-lg text-teal-900"
                >
                  {v.toFixed(2)}
                </output>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500">Read σ × [1, 0]</p>
            <p className="mt-4 font-mono text-2xl text-slate-800">
              [{matrix[0].toFixed(2)}, {matrix[2].toFixed(2)}]
            </p>
            <button
              onClick={() => {
                setMatrix([0, 0, 0, 0]);
                setWrites(0);
              }}
              className="mt-5 text-sm text-slate-600 underline underline-offset-4"
            >
              Reset connection state
            </button>
          </div>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight">
          Where the analogy stops
        </h2>
        <div className="mt-5 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[550px] bg-white text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Mechanism', 'MemoryForge / Hopfield', 'BDH / BDH-GPU'].map(
                  (t) => (
                    <th className="p-4 font-semibold" key={t}>
                      {t}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'State values',
                  '64 bipolar pixels (−1 or +1)',
                  'Sparse, positive activations',
                ],
                [
                  'During recall / inference',
                  'Fixed weights; neuron states update',
                  'Evolving connection state',
                ],
                [
                  'Purpose',
                  'Recall a small stored pattern',
                  'Language and sequence processing',
                ],
                [
                  'Learning',
                  'Outer-product storage rule',
                  'Trained parameters plus fast state',
                ],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-slate-100">
                  {row.map((t) => (
                    <td key={t} className="p-4 leading-6">
                      {t}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          BDH:{' '}
          <a
            href={paper + '#S3'}
            className="text-blue-800 underline"
            target="_blank"
            rel="noreferrer"
          >
            §3 architecture
          </a>{' '}
          and{' '}
          <a
            href={paper + '#S6.SS4'}
            className="text-blue-800 underline"
            target="_blank"
            rel="noreferrer"
          >
            §6.4 activations
          </a>
          . We do not claim BDH-CQ or Sudoku benchmark results.
        </p>
      </section>
      <section className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Sources, not slogans</h2>
          <ul className="mt-4 space-y-4 text-sm leading-6">
            <li>
              <a
                href="https://doi.org/10.1073/pnas.79.8.2554"
                className="text-blue-800 underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Hopfield (1982) · Neural networks and physical systems with
                emergent collective computational abilities ↗
              </a>
            </li>
            <li>
              <a
                href={paper}
                className="text-blue-800 underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Kosowski et al. (2025) · The Dragon Hatchling ↗
              </a>
            </li>
            <li>
              <a
                href="https://github.com/pathwaycom/bdh"
                className="text-blue-800 underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Pathway · Official BDH implementation ↗
              </a>
            </li>
          </ul>
        </div>
        <div className="rounded-xl bg-blue-600 p-6 text-white">
          <h2 className="text-lg font-semibold">
            What this experiment cannot tell us
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            A 64-neuron model does not establish how biological memory works, or
            predict a language model’s performance. Our measured rates apply
            only to the listed configurations.
          </p>
          <p className="mt-4 border-t border-white/20 pt-4 text-sm leading-7">
            A question to take further: how can a system write new associations
            without erasing useful old ones?
          </p>
        </div>
      </section>
    </div>
  );
}
