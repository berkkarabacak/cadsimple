# CADsimple

**3D CAD without the complexity.**

**[▶ Try it live](https://berkkarabacak.github.io/cadsimple/)** — no install, no account.

Open, explore, measure and simulate 3D models directly in your browser.
No installation. No account. No CAD experience required.

CADsimple is built for everyone who finds traditional CAD software overwhelming.
Visit the site, drop a file, and you're already using it — the whole interface is four verbs:
**Open → Explore → Measure → Simulate.**

## Features

- **Instant import** — drag & drop `.STL`, `.OBJ`, `.GLB`, `.GLTF`, `.SCAD` or `.ZIP`
  (ZIP archives are unpacked automatically and supported models detected)
- **Private by design** — all processing happens locally in your browser; files are never uploaded
- **Effortless navigation** — drag to rotate, scroll to zoom, right-drag to pan,
  one-click front / back / left / right / top / bottom / 3D views, perspective & orthographic
- **Object inspection** — click to select, then move, rotate, hide, isolate or fade parts
- **Simple measurement** — click two points, get a distance in mm / cm / m / inches
- **Movement simulation** — pick a pivot point, set limits, drag a slider and watch doors,
  hinges and folding parts move, with basic collision highlighting
- **Parametric models** — OpenSCAD files with top-level variables automatically get friendly
  sliders and steppers, no code editing required (source stays available under *Advanced*)

## Tech stack

- **React 19 + TypeScript + Vite**
- **Three.js + React Three Fiber + drei** for rendering
- **Tailwind CSS + shadcn/ui** for the interface
- **JSZip** for archive unpacking
- **Zustand** for state

## Getting started

```bash
git clone https://github.com/berkkarabacak/cadsimple.git
cd cadsimple
npm install
npm run dev      # http://localhost:7100
```

Other scripts:

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
npm run lint     # eslint
```

The production build is a plain static site — deploy `dist/` to Vercel, Netlify,
GitHub Pages or any static host. On Vercel, just connect the repository; no config needed.

## Architecture

```
src/
├─ pages/            Landing + Workspace (route-level)
├─ components/
│  ├─ landing/       Hero 3D demo
│  └─ viewer/        Viewport, Toolbar, panels (scene / properties / measure / simulate / params)
└─ lib/
   ├─ store.ts       Zustand state: parts, selection, tools, measurement, simulation
   ├─ importers.ts   Format dispatch: STL / OBJ / GLTF / ZIP  (add new formats here)
   ├─ scad.ts        Browser-side OpenSCAD-subset interpreter + parameter extraction
   ├─ geom.ts        Bounding boxes, view fitting, unit helpers
   └─ samples.ts     Built-in demo models
```

The layers are deliberately separated:
**UI → 3D viewer → file importers → model representation → simulation tools.**
Adding a new format means adding one importer function in `src/lib/importers.ts` —
no UI changes required.

### Roadmap

- [ ] STEP / STP and IGES import (via a browser WASM kernel)
- [ ] Full OpenSCAD compilation via WASM (the current interpreter supports a friendly subset:
      `cube`, `sphere`, `cylinder`, `translate`, `rotate`, `scale`, blocks and top-level variables;
      boolean ops are rendered as overlays)
- [ ] Export measurements / screenshots
- [ ] Shared links for models

## Contributing

Contributions are very welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
Good first issues: new import formats, more SCAD primitives, touch-gesture polish.

## License

[MIT](LICENSE) — use it, fork it, ship it.
