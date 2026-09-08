import { useEffect, useRef, useState } from 'react';
import App from './App';
import { Icon } from './components/Icon';
import { Home } from './sections/Home';
import { GuidedLesson } from './sections/GuidedLesson';
import { Research } from './sections/Research';
import { ExperimentDashboard } from './components/lab/ExperimentDashboard';
import type { LabScenario } from './components/lab/patterns';

const routes = [
  ['home', 'Home'],
  ['learn', 'Learn'],
  ['lab', 'Lab'],
  ['evidence', 'Evidence'],
  ['research', 'Research'],
] as const;
type Route = (typeof routes)[number][0];
function currentRoute(): Route {
  const name = window.location.hash.slice(1);
  return routes.some(([route]) => route === name) ? (name as Route) : 'home';
}
export default function Platform() {
  const [route, setRoute] = useState<Route>(currentRoute);
  const [menu, setMenu] = useState(false);
  const [scenario, setScenario] = useState<LabScenario | undefined>();
  const [version, setVersion] = useState(0);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const navigate = () => {
      setRoute(currentRoute());
      setMenu(false);
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.title = `MemoryForge · ${routes.find(([r]) => r === route)?.[1]}`;
    main.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route]);
  function openLab(next: LabScenario) {
    setScenario(next);
    setVersion((v) => v + 1);
    window.location.hash = 'lab';
    setRoute('lab');
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <a
        href="#page-content"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
        className="sr-only z-50 rounded-lg bg-white p-3 shadow-lg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-52 flex-col border-r border-slate-200/80 bg-white px-4 py-7 xl:flex">
        <a
          href="#home"
          aria-label="MemoryForge home"
          className="mb-10 flex items-center gap-2.5 px-2"
        >
          <span className="text-lg font-semibold tracking-tight text-slate-950">
            MemoryForge
          </span>
        </a>
        <p className="mb-3 px-3 text-xs font-semibold tracking-widest text-slate-400">
          WORKSPACE
        </p>
        <nav aria-label="Primary navigation" className="space-y-1.5">
          {routes.map(([id, label]) => (
            <a
              key={id}
              href={'#' + id}
              aria-current={route === id ? 'page' : undefined}
              className={
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                (route === id
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
              }
            >
              <Icon name={id} className="size-[18px] shrink-0" />
              {label}
              {route === id && (
                <span className="ml-auto size-1.5 rounded-full bg-coral" />
              )}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-5 px-2">
          <p className="text-sm font-medium text-slate-700">Hopfield network</p>
          <span className="mt-1 text-xs text-slate-400">
            (64 neurons)
          </span>
          <a
            href="#research"
            className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700"
          >
            Model & limitations
            <Icon name="arrow" />
          </a>
        </div>
      </aside>
      <div className="xl:pl-52">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white">
          <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8">
            <a
              href="#home"
              className="text-lg font-semibold tracking-tight xl:hidden"
            >
              MemoryForge
            </a>
            <div className="hidden items-center gap-3 text-sm xl:flex">
              <span className="text-slate-400">Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">
                {routes.find(([r]) => r === route)?.[1]}
              </span>
            </div>
            <nav
              aria-label="Compact navigation"
              className="hidden gap-1 md:flex xl:hidden"
            >
              {routes.map(([id, label]) => (
                <a
                  key={id}
                  href={'#' + id}
                  aria-current={route === id ? 'page' : undefined}
                  className="rounded-lg px-3 py-2 text-sm text-slate-500 aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:text-blue-700"
                >
                  {label}
                </a>
              ))}
            </nav>
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 xl:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Local computation
            </span>
            <button
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-controls="mobile-navigation"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm md:hidden"
            >
              {menu ? 'Close' : 'Menu'}
            </button>
          </div>
          {menu && (
            <nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              className="grid grid-cols-3 gap-2 border-t border-slate-200 bg-white p-4 md:hidden"
            >
              {routes.map(([id, label]) => (
                <a
                  key={id}
                  href={'#' + id}
                  className="rounded-lg bg-slate-50 px-3 py-3 text-center text-sm"
                  aria-current={route === id ? 'page' : undefined}
                >
                  {label}
                </a>
              ))}
            </nav>
          )}
        </header>
        <main
          id="page-content"
          ref={main}
          tabIndex={-1}
          className="mx-auto max-w-[1500px] px-4 outline-none sm:px-8"
        >
          {route === 'home' && <Home />}
          {route === 'learn' && <GuidedLesson onOpenLab={openLab} />}
          <div hidden={route !== 'lab'}>
            <App
              key={version}
              embedded
              active={route === 'lab'}
              initialScenario={scenario}
            />
          </div>
          {route === 'evidence' && (
            <div className="py-10">
              <h1 className="page-title mt-2 mb-3">
                Measure recall performance.
              </h1>
              <p className="mb-8 max-w-2xl text-base leading-7 text-slate-500">
                Change one variable at a time. Compare recovery across noise
                levels and memory loads, then bring an observed example into the
                playground.
              </p>
              <ExperimentDashboard onLoadScenario={openLab} />
            </div>
          )}
          {route === 'research' && <Research />}
        </main>
        <footer className="mx-auto mt-8 flex max-w-[1500px] flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-5 py-6 text-xs text-slate-500 sm:px-8">
          <p>
            MemoryForge · Classical Hopfield network
          </p>
        </footer>
      </div>
    </div>
  );
}
