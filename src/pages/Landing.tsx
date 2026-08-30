import { useNavigate } from 'react-router'
import {
  Box,
  Github,
  FolderOpen,
  Orbit,
  Ruler,
  Play,
  Move3d,
  ShieldCheck,
  Zap,
  HeartHandshake,
  MousePointer2,
} from 'lucide-react'
import { HeroCanvas } from '@/components/landing/HeroCanvas'
import { GITHUB_URL } from '@/components/viewer/TopBar'

const STEPS = [
  {
    icon: FolderOpen,
    title: 'Open',
    text: 'Drop an STL, OBJ, GLB, GLTF, SCAD or ZIP file. It opens instantly — nothing leaves your device.',
    accent: 'from-cyan-400/20 to-cyan-400/5 text-cyan-300 ring-cyan-400/30',
  },
  {
    icon: Orbit,
    title: 'Explore',
    text: 'Drag to rotate, scroll to zoom, right-drag to pan. Snap to front, top or side views in one click.',
    accent: 'from-violet-400/20 to-violet-400/5 text-violet-300 ring-violet-400/30',
  },
  {
    icon: Ruler,
    title: 'Measure',
    text: 'Click two points, get a distance. Millimetres, centimetres, metres or inches — your choice.',
    accent: 'from-teal-400/20 to-teal-400/5 text-teal-300 ring-teal-400/30',
  },
  {
    icon: Play,
    title: 'Simulate',
    text: 'Pick a pivot, set limits, drag a slider. Watch doors, hinges and folding parts actually move.',
    accent: 'from-pink-400/20 to-pink-400/5 text-pink-300 ring-pink-400/30',
  },
]

const PRINCIPLES = [
  { icon: Zap, title: 'Zero setup', text: 'No install, no account, no tutorial. Open the page and you are already using it.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Files are processed locally in your browser. Nothing is uploaded, ever.' },
  { icon: HeartHandshake, title: 'Open source', text: 'MIT licensed. Add a format, build a tool, shape the roadmap on GitHub.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full overflow-x-hidden bg-[#0a0f16] text-slate-100">
      {/* nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0a0f16]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-lg shadow-cyan-500/25">
            <Box className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">CADsimple</span>
          <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300 sm:inline">
            Free &amp; Open Source
          </span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={() => navigate('/app')}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-300 hover:shadow-cyan-400/40"
            >
              Open a 3D Model
            </button>
          </div>
        </div>
      </nav>

      {/* hero */}
      <section className="bg-grid relative">
        <div className="bg-glow absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-32 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-40">
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300">
              <Move3d className="h-3.5 w-3.5 text-cyan-300" />
              CAD, but simple
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              3D CAD without the <span className="text-gradient">complexity.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-400">
              Open, explore, measure and simulate 3D models directly in your browser.
              No installation. No CAD experience required.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/app')}
                className="group flex items-center gap-2.5 rounded-2xl bg-cyan-400 px-7 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-cyan-400/50"
              >
                <FolderOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
                Open a 3D Model
              </button>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-base font-semibold text-slate-200 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
              >
                <Github className="h-5 w-5" />
                View on GitHub
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <MousePointer2 className="h-4 w-4 text-cyan-400/70" />
              Try it: the model on the right is live — drag it around.
            </p>
          </div>

          <div className="animate-fade-up relative [animation-delay:150ms]">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-cyan-500/15 via-transparent to-indigo-500/15 blur-2xl" />
            <div className="glass relative aspect-square overflow-hidden rounded-[2rem] shadow-2xl shadow-black/50 ring-1 ring-white/10">
              <HeroCanvas />
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur">
                Drag to rotate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* capabilities */}
      <section className="relative border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need. <span className="text-gradient">Nothing you don't.</span>
            </h2>
            <p className="mt-3 text-slate-400">Four verbs. That's the whole interface.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="group glass rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:ring-1 hover:ring-white/15"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ${s.accent}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">0{i + 1}</span>
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* formats */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              A free online viewer for every 3D format you actually have.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-slate-400">
              CADsimple works as an <strong className="text-slate-200">online STL viewer</strong>,{' '}
              <strong className="text-slate-200">OBJ viewer</strong> and{' '}
              <strong className="text-slate-200">GLB / glTF viewer</strong> — and it can preview{' '}
              <strong className="text-slate-200">OpenSCAD</strong> files with live parametric controls.
              Drop a whole ZIP archive and every model inside is unpacked and laid out for you.
              STEP and IGES support is on the open roadmap.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { ext: '.STL', note: '3D prints & scans' },
              { ext: '.OBJ', note: 'classic mesh exchange' },
              { ext: '.GLB', note: 'web & AR models' },
              { ext: '.GLTF', note: 'web & AR models' },
              { ext: '.SCAD', note: 'parametric, live sliders' },
              { ext: '.ZIP', note: 'auto-unpacked archives' },
            ].map((f) => (
              <div key={f.ext} className="glass rounded-2xl p-5 transition-colors hover:ring-1 hover:ring-cyan-400/30">
                <div className="font-display text-lg font-bold text-cyan-300">{f.ext}</div>
                <div className="mt-1 text-xs text-slate-500">{f.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* principles */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Feels like a map app, <br />not an engineering suite.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-slate-400">
              Traditional CAD buries you in toolbars, modes and jargon. CADsimple keeps the viewport
              front and centre and shows you only the tool you need right now. If a feature needs a
              manual, it doesn't ship.
            </p>
          </div>
          <div className="space-y-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="glass flex gap-4 rounded-2xl p-5 transition-colors hover:ring-1 hover:ring-white/15">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/25">
                  <p.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-400">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* open source CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="bg-grid glass relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-center sm:px-16">
            <div className="bg-glow absolute inset-0" />
            <div className="relative">
              <Github className="mx-auto mb-5 h-10 w-10 text-slate-300" />
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Free &amp; Open Source, forever.</h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-400">
                MIT licensed and built in the open. Add an importer for your favourite format,
                design a new tool, or just follow along — contributions welcome.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Star on GitHub
                </a>
                <a
                  href={`${GITHUB_URL}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Request a feature
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-cyan-400" />
            <span className="font-display font-semibold text-slate-300">CADsimple</span>
            <span>· 3D CAD without the complexity</span>
          </div>
          <div className="flex items-center gap-5">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-slate-300">GitHub</a>
            <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="transition-colors hover:text-slate-300">MIT License</a>
            <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer" className="transition-colors hover:text-slate-300">Issues</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
