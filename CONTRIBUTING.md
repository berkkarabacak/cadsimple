# Contributing to CADsimple

Thanks for helping make CAD simple! This project optimizes for one thing above all else:

> **Could someone who has never opened CAD software understand this without a tutorial?**

If a change makes the core flow — *open → explore → measure → simulate* — simpler, we want it.
If it adds jargon, modes or mandatory dialogs, it needs a very good reason.

## Ways to contribute

- **Add an import format** — STEP/IGES are the most requested. Add a loader in
  `src/lib/importers.ts`; the UI picks it up automatically.
- **Extend the SCAD subset** — more primitives (`polyhedron`, `text`), `for` loops,
  real boolean ops via a WASM backend in `src/lib/scad.ts`.
- **Polish interactions** — touch gestures, keyboard shortcuts, accessibility.
- **Report bugs & request features** — open an issue with a model file that misbehaves.

## Development

```bash
npm install
npm run dev     # dev server with HMR
npm run build   # type-check + production build
npm run lint
```

Please make sure `npm run build` passes before opening a PR.

## Code guidelines

- TypeScript strict, no `any` unless unavoidable.
- Keep UI text plain and friendly — no engineering jargon.
- Progressive disclosure: show only the tools needed for the current action.
- Small, focused PRs beat big ones.

## License

By contributing, you agree that your contributions are licensed under the MIT License.
