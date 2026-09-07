import { useState } from 'react';
import { Icon } from '../components/Icon';

const paths = [
  {
    id: 'learn',
    label: 'Teach me',
    title: 'Start with one memory.',
    body: 'A guided experiment that connects the picture you see to the computations underneath.',
    action: 'Begin the guided lesson',
    steps: [
      'See how a pattern becomes shared weights',
      'Recover a memory from a damaged clue',
      'Discover why a stable answer can be wrong',
    ],
  },
  {
    id: 'lab',
    label: 'Let me explore',
    title: 'Make it your experiment.',
    body: 'Your patterns. Your noise level. A small network you can inspect, one decision at a time.',
    action: 'Enter the pattern lab',
    steps: [
      'Draw and store your own patterns',
      'Change the cue without changing the original',
      'Inspect computed states and connection weights',
    ],
  },
  {
    id: 'evidence',
    label: 'Show me results',
    title: 'Put the idea to the test.',
    body: 'Look beyond a single successful recall. Compare reproducible runs and see where recovery breaks down.',
    action: 'Explore the evidence',
    steps: [
      'Compare increasing noise and memory load',
      'Distinguish exact recall from convergence',
      'Open a measured example in the lab',
    ],
  },
] as const;

export function Home() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="mx-auto max-w-6xl py-7 sm:py-10 lg:py-12">
      <section className="grid items-center gap-10 border-b border-slate-200 pb-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-14">
        <div>
          <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            <span aria-hidden="true" className="h-px w-8 bg-blue-500" /> A field
            guide to neural memory
          </p>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.07] tracking-[-0.05em] text-slate-950">
            Memories aren't
            <br />
            <span className="text-blue-600">just stored.</span>
            <br />
            They're connected.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Explore a small Hopfield network: how shared connections recover a
            pattern, and why competing memories can lead to the wrong answer.
          </p>
          <a
            href="#learn"
            className="button-primary group mt-7 inline-flex gap-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            Start learning <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-4 text-sm text-slate-500">
            No AI background needed.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/80 pt-5 text-sm text-slate-500">
            <span>
              <span className="font-semibold text-slate-700">64</span> visible
              neurons
            </span>
            <span>Real computations</span>
            <span>Runs locally</span>
          </div>
        </div>

        <div className="relative min-w-0 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_16px_50px_-30px_#6554e845] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Find your starting point
            </h2>
            <span className="font-mono text-xs text-slate-400">
              0{selected + 1} / 03
            </span>
          </div>
          <fieldset className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            <legend className="sr-only">
              How would you like to explore MemoryForge?
            </legend>
            {paths.map((item, i) => (
              <label key={item.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="home-path"
                  value={item.id}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                  className="peer sr-only"
                />
                <span className="flex h-full min-h-11 items-center justify-center rounded-lg px-2 py-2 text-center text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-blue-700 peer-checked:bg-white peer-checked:text-blue-700 peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600">
                  {item.label}
                </span>
              </label>
            ))}
          </fieldset>
          <div className="mt-6 grid">
            {paths.map((path, index) => (
              <div
                key={path.id}
                inert={selected !== index}
                aria-hidden={selected !== index}
                className={`col-start-1 row-start-1 flex flex-col ${selected === index ? 'visible' : 'invisible'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                    <Icon name={path.id} />
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                    {index === 0
                      ? 'Guided · 5 steps'
                      : index === 1
                        ? 'Sandbox · self-paced'
                        : 'Evidence · reproducible'}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                  {path.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {path.body}
                </p>
                <ol className="mb-7 mt-5 flex-1 space-y-4 border-t border-slate-100 pt-5">
                  {path.steps.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-xs text-slate-500">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <a
                  href={'#' + path.id}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                >
                  {path.action}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                  >
                    ↗
                  </span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="grid gap-6 py-9 sm:py-12 lg:grid-cols-[.7fr_1.3fr]"
        aria-labelledby="idea-heading"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-blue-700">
            The idea behind the experiment
          </p>
          <h2
            id="idea-heading"
            className="mt-3 text-2xl font-semibold tracking-tight text-slate-900"
          >
            Shared connections.
            <br />
            Competing memories.
          </h2>
        </div>
        <div>
          <p className="text-lg leading-8 text-slate-600">
            With the same cue and update order, adding memories to shared
            Hopfield weights can turn a correct recall into a stable but
            incorrect answer.
          </p>
          <a
            href="#learn"
            className="mt-4 inline-flex items-center gap-3 text-sm font-semibold text-blue-700 rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            Test the claim in the guided lesson{' '}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">
        A few things before you start
      </h2>
      <section
        aria-label="Before you begin"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        {[
          [
            'What will I actually learn?',
            'How associations are written into shared weights, how neuron states change during recall, and how competing memories can interfere. You will compare the intended answer with the computed result.',
          ],
          [
            'Is this a real neural network?',
            'Yes—a small, classical Hopfield network with 64 bipolar neurons. The lab computes its weights and updates locally. It is not a chatbot or a simulation of a biological brain.',
          ],
          [
            'How does this connect to BDH?',
            'The lesson connects shared associations to the Dragon Hatchling paper’s evolving connection state. It explains the distinction: Hopfield weights stay fixed during recall; BDH can update inference state. MemoryForge does not implement BDH.',
          ],
        ].map(([question, answer]) => (
          <details
            key={question}
            name="home-questions"
            className="group border-b border-slate-100 last:border-b-0"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-base font-medium text-slate-800 marker:content-none hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 sm:px-7 [&::-webkit-details-marker]:hidden">
              {question}
              <span
                aria-hidden="true"
                className="text-xl font-normal text-blue-600 group-open:hidden"
              >
                +
              </span>
              <span
                aria-hidden="true"
                className="hidden text-xl font-normal text-blue-600 group-open:inline"
              >
                −
              </span>
            </summary>
            <p className="max-w-3xl px-5 pb-6 text-base leading-7 text-slate-600 sm:px-7">
              {answer}
            </p>
          </details>
        ))}
      </section>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <p>Small model. Visible state. Reproducible experiments.</p>
        <a
          href="#research"
          className="text-blue-700 rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          Read the sources &amp; limitations ↗
        </a>
      </div>
    </div>
  );
}
