import * as THREE from 'three'
import { uid, type Part, type ScadParam, type Vec3 } from './store'
import { partColor } from './palette'

/**
 * A friendly OpenSCAD-subset interpreter that runs fully in the browser.
 *
 * Supported:
 * - numeric / vector expressions (+ - * /, parentheses, unary minus, indexing v[i])
 * - top-level variable assignments (exposed as parametric controls)
 * - module definitions & calls (with parameters and lexical scope)
 * - for loops over ranges [a:b:c] and lists, if/else
 * - cube / sphere / cylinder primitives
 * - translate / rotate / scale transforms
 * - color([r,g,b]) (0..1 floats)
 * - minkowski() of cube+sphere → rounded box
 * - union / difference / intersection blocks (rendered as a group overlay)
 *
 * Full OpenSCAD compilation can later be swapped in via a WASM backend
 * behind the same `compileScad` interface.
 */

type Value = number | number[]

interface Env {
  vars: Map<string, Value>
  parent?: Env
}

/** OpenSCAD coordinates are Z-up; the viewer renders a Y-up world. */
const SCAD_TO_YUP = new THREE.Matrix4().makeRotationX(-Math.PI / 2)

function lookup(env: Env, name: string): Value | undefined {
  let e: Env | undefined = env
  while (e) {
    const v = e.vars.get(name)
    if (v !== undefined) return v
    e = e.parent
  }
  return undefined
}

/* ---------------- lexer ---------------- */

interface Tok {
  t: 'num' | 'id' | 'str' | 'sym'
  v: string
}

function lex(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  const isSym = (c: string) => '{}()[]=;,:+-*/%<>!'.includes(c)
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) { i++; continue }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue }
    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.eE+-]/.test(src[j]) && !(j > i && /[+-]/.test(src[j]) && !/[eE]/.test(src[j - 1]))) j++
      toks.push({ t: 'num', v: src.slice(i, j) }); i = j; continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++
      toks.push({ t: 'id', v: src.slice(i, j) }); i = j; continue
    }
    if (c === '"') {
      let j = i + 1
      while (j < src.length && src[j] !== '"') j++
      toks.push({ t: 'str', v: src.slice(i + 1, j) }); i = j + 1; continue
    }
    if (isSym(c)) { toks.push({ t: 'sym', v: c }); i++; continue }
    i++
  }
  return toks
}

/* ---------------- rounded box (minkowski cube+sphere) ---------------- */

function roundedBoxGeo(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const rr = Math.max(0.1, Math.min(r, w / 2 - 0.1, h / 2 - 0.1, d / 2 - 0.1))
  const x = w / 2 - rr
  const y = h / 2 - rr
  const shape = new THREE.Shape()
  shape.moveTo(-x + rr, -y)
  shape.lineTo(x - rr, -y)
  shape.absarc(x - rr, -y + rr, rr, -Math.PI / 2, 0, false)
  shape.lineTo(x, y - rr)
  shape.absarc(x - rr, y - rr, rr, 0, Math.PI / 2, false)
  shape.lineTo(-x + rr, y)
  shape.absarc(-x + rr, y - rr, rr, Math.PI / 2, Math.PI, false)
  shape.lineTo(-x, -y + rr)
  shape.absarc(-x + rr, -y + rr, rr, Math.PI, Math.PI * 1.5, false)
  const depth = Math.max(0.1, d - 2 * rr)
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: rr,
    bevelSize: rr,
    bevelSegments: 4,
    steps: 1,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

/* ---------------- parser / evaluator ---------------- */

interface ModuleDef {
  params: { name: string; def?: Value }[]
  body: Tok[]
}

interface Shared {
  geometries: { geometry: THREE.BufferGeometry; name: string; color?: string }[]
  params: ScadParam[]
  counts: Record<string, number>
  modules: Map<string, ModuleDef>
}

class Parser {
  pos = 0
  private toks: Tok[]
  private overrides: Record<string, number>
  private shared: Shared

  constructor(toks: Tok[], overrides: Record<string, number>, shared: Shared) {
    this.toks = toks
    this.overrides = overrides
    this.shared = shared
  }

  peek(): Tok | undefined { return this.toks[this.pos] }
  next(): Tok | undefined { return this.toks[this.pos++] }
  expectSym(s: string) {
    const t = this.next()
    if (!t || t.t !== 'sym' || t.v !== s) throw new Error(`Expected "${s}" but found "${t?.v ?? 'end of file'}"`)
  }
  acceptSym(s: string): boolean {
    const t = this.peek()
    if (t && t.t === 'sym' && t.v === s) { this.pos++; return true }
    return false
  }

  run() {
    const env: Env = { vars: new Map() }
    while (this.pos < this.toks.length) {
      this.statement(env, new THREE.Matrix4(), undefined, true)
    }
  }

  statement(env: Env, matrix: THREE.Matrix4, color: string | undefined, topLevel = false) {
    const t = this.peek()
    if (!t) return
    if (t.t === 'sym' && t.v === ';') { this.pos++; return }
    if (t.t !== 'id') { this.pos++; return }
    const name = t.v
    const after = this.toks[this.pos + 1]

    // variable assignment
    if (after && after.t === 'sym' && after.v === '=') {
      this.pos += 2
      let value = this.expr(env)
      this.acceptSym(';')
      if (topLevel && name in this.overrides) value = this.overrides[name]
      env.vars.set(name, value)
      if (topLevel && typeof value === 'number' && !name.startsWith('$')) {
        const v = value
        const step = Math.max(Math.abs(v) / 50, Number.isInteger(v) ? 1 : 0.1)
        this.shared.params.push({ name, value: v, step: Math.round(step * 100) / 100 })
      }
      return
    }

    // module definition
    if (name === 'module') {
      this.pos++
      this.parseModuleDef(env)
      return
    }
    if (name === 'function') {
      // function definitions are skipped (not needed for supported models)
      this.pos++
      while (this.pos < this.toks.length && !(this.peek()?.t === 'sym' && this.peek()?.v === ';')) this.pos++
      this.acceptSym(';')
      return
    }

    // module call?
    const mod = this.shared.modules.get(name)
    if (mod && after && after.t === 'sym' && after.v === '(') {
      this.pos++
      const args = this.callArgs(env)
      this.invokeModule(mod, args, env, matrix, color)
      this.acceptSym(';')
      return
    }

    // builtin modifier / primitive
    this.pos++
    this.modifier(name, env, matrix, color)
  }

  parseModuleDef(env: Env) {
    const nameTok = this.next()
    if (!nameTok || nameTok.t !== 'id') throw new Error('Expected module name')
    const params: ModuleDef['params'] = []
    this.expectSym('(')
    while (this.pos < this.toks.length) {
      if (this.acceptSym(')')) break
      const p = this.next()
      if (p && p.t === 'id') {
        let def: Value | undefined
        if (this.acceptSym('=')) def = this.expr(env)
        params.push({ name: p.v, def })
      }
      this.acceptSym(',')
    }
    this.expectSym('{')
    const start = this.pos
    let depth = 1
    while (this.pos < this.toks.length && depth > 0) {
      const t = this.next()
      if (t?.t === 'sym' && t.v === '{') depth++
      if (t?.t === 'sym' && t.v === '}') depth--
    }
    const body = this.toks.slice(start, this.pos - 1)
    this.shared.modules.set(nameTok.v, { params, body })
  }

  invokeModule(
    mod: ModuleDef,
    args: { positional: Value[]; named: Record<string, Value> },
    callerEnv: Env,
    matrix: THREE.Matrix4,
    color: string | undefined,
  ) {
    const env: Env = { vars: new Map(), parent: callerEnv }
    mod.params.forEach((p, i) => {
      const v = args.named[p.name] ?? args.positional[i] ?? p.def ?? 0
      env.vars.set(p.name, v)
    })
    const sub = new Parser(mod.body, this.overrides, this.shared)
    while (sub.pos < mod.body.length) {
      sub.statement(env, matrix, color)
    }
  }

  skipBlock() {
    if (!this.acceptSym('{')) return
    let depth = 1
    while (this.pos < this.toks.length && depth > 0) {
      const t = this.next()
      if (t?.t === 'sym' && t.v === '{') depth++
      if (t?.t === 'sym' && t.v === '}') depth--
    }
  }

  skipStatement() {
    if (this.peek()?.t === 'sym' && this.peek()?.v === '{') {
      this.skipBlock()
      return
    }
    let depth = 0
    while (this.pos < this.toks.length) {
      const t = this.next()
      if (!t) return
      if (t.t === 'sym') {
        if (t.v === '{' || t.v === '(' || t.v === '[') depth++
        if (t.v === '}' || t.v === ')' || t.v === ']') depth--
        if (t.v === ';' && depth <= 0) return
      }
    }
  }

  modifier(name: string, env: Env, matrix: THREE.Matrix4, color: string | undefined) {
    const lower = name.toLowerCase()

    if (lower === 'for') {
      this.expectSym('(')
      const varTok = this.next()
      this.expectSym('=')
      const range = this.expr(env)
      this.expectSym(')')
      const values = Array.isArray(range) ? range : [range]
      if (varTok && varTok.t === 'id') {
        const bodyStart = this.pos
        for (const v of values.slice(0, 500)) {
          const childEnv: Env = { vars: new Map([[varTok.v, v]]), parent: env }
          this.pos = bodyStart
          this.children(childEnv, matrix, color)
        }
      } else {
        this.children(env, matrix, color)
      }
      return
    }

    if (lower === 'if') {
      this.expectSym('(')
      const cond = this.expr(env)
      this.expectSym(')')
      if (truthy(cond)) {
        this.children(env, matrix, color)
        if (this.peek()?.t === 'id' && this.peek()?.v === 'else') {
          this.pos++
          this.skipStatement()
        }
      } else {
        this.skipStatement()
        if (this.peek()?.t === 'id' && this.peek()?.v === 'else') {
          this.pos++
          this.children(env, matrix, color)
        }
      }
      return
    }

    const args = this.callArgs(env)

    if (lower === 'translate' || lower === 'rotate' || lower === 'scale' || lower === 'mirror' || lower === 'color') {
      const m = matrix.clone()
      let c = color
      if (lower === 'translate') {
        const v = toVec(args.positional[0])
        m.multiply(new THREE.Matrix4().makeTranslation(v[0], v[1], v[2]))
      } else if (lower === 'rotate') {
        const v = toVec(args.positional[0])
        const e = new THREE.Euler(
          THREE.MathUtils.degToRad(v[0]),
          THREE.MathUtils.degToRad(v[1]),
          THREE.MathUtils.degToRad(v[2]),
          'XYZ',
        )
        m.multiply(new THREE.Matrix4().makeRotationFromEuler(e))
      } else if (lower === 'scale') {
        const v = toVec(args.positional[0], 1)
        m.multiply(new THREE.Matrix4().makeScale(v[0], v[1], v[2]))
      } else if (lower === 'color') {
        c = toColor(args.positional[0]) ?? color
      }
      this.children(env, m, c)
      return
    }

    if (lower === 'minkowski') {
      // special-case: minkowski() { cube([..], center=..); sphere(r=..); } → rounded box
      const checkpoint = this.pos
      try {
        this.expectSym('{')
        const cubeTok = this.next()
        if (!cubeTok || cubeTok.v !== 'cube') throw new Error('pattern')
        const cubeArgs = this.callArgs(env)
        this.acceptSym(';')
        const sphTok = this.next()
        if (!sphTok || sphTok.v !== 'sphere') throw new Error('pattern')
        const sphArgs = this.callArgs(env)
        this.acceptSym(';')
        this.expectSym('}')
        const sizeRaw = cubeArgs.named['size'] ?? cubeArgs.positional[0]
        const size = Array.isArray(sizeRaw) ? toVec(sizeRaw, 10) : ([num(sizeRaw, 10), num(sizeRaw, 10), num(sizeRaw, 10)] as Vec3)
        const r = num(sphArgs.named['r'] ?? sphArgs.positional[0], 5)
        this.emit(roundedBoxGeo(size[0], size[1], size[2], r), 'rounded box', matrix, color)
      } catch {
        // not the cube+sphere pattern — render children as a plain union
        this.pos = checkpoint
        this.children(env, matrix, color)
      }
      return
    }

    if (lower === 'union' || lower === 'difference' || lower === 'intersection' || lower === 'group' || lower === 'hull') {
      // booleans/hulls rendered as overlay groups in the subset
      this.children(env, matrix, color)
      return
    }

    if (lower === 'echo' || lower === 'render' || lower === 'children' || lower === 'assert') {
      this.children(env, matrix, color)
      return
    }

    if (lower === 'cube') {
      const sizeRaw = args.named['size'] ?? args.positional[0]
      const size = Array.isArray(sizeRaw) ? toVec(sizeRaw, 1) : ([num(sizeRaw, 1), num(sizeRaw, 1), num(sizeRaw, 1)] as Vec3)
      const center = truthy(args.named['center'] ?? args.positional[1])
      const g = new THREE.BoxGeometry(size[0], size[1], size[2])
      if (!center) g.translate(size[0] / 2, size[1] / 2, size[2] / 2)
      this.emit(g, 'cube', matrix, color)
      return
    }
    if (lower === 'sphere') {
      let r = num(args.named['r'] ?? args.positional[0], NaN)
      if (Number.isNaN(r)) r = num(args.named['d'] ?? args.positional[0], 10) / (args.named['d'] !== undefined ? 2 : 1)
      const g = new THREE.SphereGeometry(r, 36, 24)
      this.emit(g, 'sphere', matrix, color)
      return
    }
    if (lower === 'cylinder') {
      const h = num(args.named['h'] ?? args.positional[0], 10)
      let r1 = num(args.named['r1'] ?? args.named['r'] ?? args.positional[1], NaN)
      let r2 = num(args.named['r2'] ?? args.named['r'] ?? args.positional[2] ?? args.positional[1], NaN)
      if (Number.isNaN(r1)) r1 = num(args.named['d1'] ?? args.named['d'] ?? 10, 10) / 2
      if (Number.isNaN(r2)) r2 = num(args.named['d2'] ?? args.named['d'] ?? 10, 10) / 2
      const center = truthy(args.named['center'] ?? args.positional[3])
      const g = new THREE.CylinderGeometry(r2, r1, h, 36)
      if (!center) g.translate(0, h / 2, 0)
      this.emit(g, 'cylinder', matrix, color)
      return
    }
    // unknown call — try to swallow children to keep parsing
    this.children(env, matrix, color)
  }

  children(env: Env, matrix: THREE.Matrix4, color: string | undefined) {
    if (this.acceptSym('{')) {
      while (this.pos < this.toks.length) {
        if (this.acceptSym('}')) return
        this.statement(env, matrix, color)
      }
      return
    }
    const t = this.peek()
    if (t && t.t === 'sym' && t.v === ';') { this.pos++; return }
    this.statement(env, matrix, color)
  }

  callArgs(env: Env): { positional: Value[]; named: Record<string, Value> } {
    const positional: Value[] = []
    const named: Record<string, Value> = {}
    if (!this.acceptSym('(')) return { positional, named }
    while (this.pos < this.toks.length) {
      if (this.acceptSym(')')) break
      const t = this.peek()
      if (t?.t === 'id' && this.toks[this.pos + 1]?.v === '=') {
        this.pos += 2
        named[t.v] = this.expr(env)
      } else {
        positional.push(this.expr(env))
      }
      this.acceptSym(',')
    }
    return { positional, named }
  }

  /* expression evaluation: numbers, vectors, ranges, + - * / unary, indexing */
  expr(env: Env): Value {
    let left = this.term(env)
    for (;;) {
      if (this.acceptSym('+')) left = add(left, this.term(env))
      else if (this.acceptSym('-')) left = sub(left, this.term(env))
      else break
    }
    return left
  }

  term(env: Env): Value {
    let left = this.factor(env)
    for (;;) {
      if (this.acceptSym('*')) left = mul(left, this.factor(env))
      else if (this.acceptSym('/')) left = div(left, this.factor(env))
      else break
    }
    return left
  }

  factor(env: Env): Value {
    const t = this.next()
    if (!t) return 0
    let v: Value
    if (t.t === 'num') v = parseFloat(t.v)
    else if (t.t === 'str') v = 0
    else if (t.t === 'sym' && t.v === '-') v = mul(-1, this.factor(env))
    else if (t.t === 'sym' && t.v === '(') {
      v = this.expr(env)
      this.acceptSym(')')
    } else if (t.t === 'sym' && t.v === '[') {
      // vector [a,b,c] or range [a:b:c] / [a:b]
      const first = this.expr(env)
      if (this.acceptSym(':')) {
        const second = this.expr(env)
        let step = 1
        let end = second
        if (this.acceptSym(':')) {
          step = second as number
          end = this.expr(env)
        }
        this.acceptSym(']')
        v = expandRange(num(first, 0), step, num(end, 0))
      } else {
        const arr: number[] = [num(first, 0)]
        while (this.pos < this.toks.length) {
          if (this.acceptSym(']')) break
          this.acceptSym(',')
          arr.push(num(this.expr(env), 0))
        }
        v = arr
      }
    } else if (t.t === 'id') {
      if (t.v === 'true') v = 1
      else if (t.v === 'false') v = 0
      else if (t.v === 'PI') v = Math.PI
      else if (t.v === 'undef') v = 0
      else if (t.v.startsWith('$')) v = 32
      else v = lookup(env, t.v) ?? 0
    } else {
      return 0
    }
    // postfix indexing: v[expr]
    while (this.peek()?.t === 'sym' && this.peek()?.v === '[') {
      this.pos++
      const idx = num(this.expr(env), 0)
      this.acceptSym(']')
      v = Array.isArray(v) ? (v[Math.round(idx)] ?? 0) : v
    }
    return v
  }

  emit(geometry: THREE.BufferGeometry, kind: string, matrix: THREE.Matrix4, color?: string) {
    geometry.applyMatrix4(matrix)
    geometry.applyMatrix4(SCAD_TO_YUP)
    geometry.computeVertexNormals()
    this.shared.counts[kind] = (this.shared.counts[kind] ?? 0) + 1
    this.shared.geometries.push({ geometry, name: `${kind} ${this.shared.counts[kind]}`, color })
  }
}

/* ---------------- value helpers ---------------- */

function num(v: Value | undefined, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return fallback
}
function toVec(v: Value | undefined, fill = 0): Vec3 {
  if (Array.isArray(v)) return [v[0] ?? fill, v[1] ?? fill, v[2] ?? fill]
  const n = num(v, fill)
  return [n, n, n]
}
function truthy(v: Value | undefined): boolean {
  if (typeof v === 'number') return v !== 0
  return false
}
function add(a: Value, b: Value): Value {
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => x + (b[i] ?? 0))
  return num(a, 0) + num(b, 0)
}
function sub(a: Value, b: Value): Value {
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => x - (b[i] ?? 0))
  return num(a, 0) - num(b, 0)
}
function mul(a: Value, b: Value): Value {
  if (Array.isArray(a)) return a.map((x) => x * num(b, 1))
  if (Array.isArray(b)) return b.map((x) => x * num(a, 1))
  return num(a, 0) * num(b, 0)
}
function div(a: Value, b: Value): Value {
  if (Array.isArray(a)) return a.map((x) => x / num(b, 1))
  return num(a, 0) / num(b, 1)
}
function expandRange(start: number, step: number, end: number): number[] {
  const out: number[] = []
  if (step === 0) return [start]
  if (step > 0) for (let v = start; v <= end && out.length < 10000; v += step) out.push(v)
  else for (let v = start; v >= end && out.length < 10000; v += step) out.push(v)
  return out
}
function toColor(v: Value | undefined): string | undefined {
  if (!Array.isArray(v)) return undefined
  const c = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0')
  return `#${c(v[0] ?? 0.8)}${c(v[1] ?? 0.8)}${c(v[2] ?? 0.8)}`
}

/* ---------------- public API ---------------- */

export interface ScadResult {
  parts: Part[]
  params: ScadParam[]
}

export function compileScad(source: string, groupId: string, overrides: Record<string, number> = {}): ScadResult {
  const shared: Shared = { geometries: [], params: [], counts: {}, modules: new Map() }
  const parser = new Parser(lex(source), overrides, shared)
  parser.run()
  if (shared.geometries.length === 0) {
    throw new Error('No shapes found. The online preview supports cube, sphere and cylinder with translate/rotate/scale.')
  }
  const parts: Part[] = shared.geometries.map((g, i) => ({
    id: uid(),
    name: g.name,
    geometry: g.geometry,
    color: g.color ?? partColor(i),
    visible: true,
    opacity: 1,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    groupId,
    format: 'scad',
    sim: null,
  }))
  const seen = new Set<string>()
  const params = shared.params.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)))
  return { parts, params }
}
