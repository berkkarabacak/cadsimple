import { create } from 'zustand'
import type * as THREE from 'three'

export type Vec3 = [number, number, number]
export type UnitName = 'mm' | 'cm' | 'm' | 'in'
export type ToolMode = 'orbit' | 'pan' | 'measure' | 'pickPivot'
export type ViewName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso'

export interface SimConfig {
  type: 'rotate' | 'slide'
  pivot: Vec3
  axis: Vec3
  min: number
  max: number
  value: number
}

export interface Part {
  id: string
  name: string
  geometry: THREE.BufferGeometry
  color: string
  visible: boolean
  opacity: number
  /** user transform — position in mm, rotation in degrees */
  position: Vec3
  rotation: Vec3
  groupId: string
  format: string
  sim: SimConfig | null
}

export interface ScadParam {
  name: string
  value: number
  step: number
}

export interface CameraCommand {
  id: number
  type: 'fit' | 'reset' | 'zoomIn' | 'zoomOut' | 'view'
  view?: ViewName
}

export interface SimDraft {
  targetId: string
  type: 'rotate' | 'slide'
  pivot: Vec3 | null
  axis: Vec3
  min: number
  max: number
}

let counter = 0
export const uid = () => `p${Date.now().toString(36)}_${counter++}`

interface CadState {
  parts: Part[]
  selectedId: string | null
  isolatedId: string | null
  tool: ToolMode
  unit: UnitName
  ortho: boolean
  measureA: Vec3 | null
  measureB: Vec3 | null
  scad: { groupId: string; source: string } | null
  params: ScadParam[]
  cameraCommand: CameraCommand | null
  loading: string | null
  simDraft: SimDraft | null
  collidingIds: string[]

  setParts: (parts: Part[], opts?: { scadSource?: string; params?: ScadParam[]; groupId?: string }) => void
  clearAll: () => void
  select: (id: string | null) => void
  toggleVisible: (id: string) => void
  setOpacity: (id: string, opacity: number) => void
  isolate: (id: string | null) => void
  setTool: (tool: ToolMode) => void
  setUnit: (unit: UnitName) => void
  toggleOrtho: () => void
  setMeasurePoint: (p: Vec3) => void
  clearMeasure: () => void
  setPartTransform: (id: string, patch: Partial<Pick<Part, 'position' | 'rotation'>>) => void
  setSim: (id: string, sim: SimConfig | null) => void
  setSimValue: (id: string, value: number) => void
  commandCamera: (type: CameraCommand['type'], view?: ViewName) => void
  setLoading: (msg: string | null) => void
  setSimDraft: (draft: SimDraft | null) => void
  setCollidingIds: (ids: string[]) => void
  replaceGroup: (groupId: string, parts: Part[], params?: ScadParam[]) => void
}

export const useCad = create<CadState>((set) => ({
  parts: [],
  selectedId: null,
  isolatedId: null,
  tool: 'orbit',
  unit: 'mm',
  ortho: false,
  measureA: null,
  measureB: null,
  scad: null,
  params: [],
  cameraCommand: null,
  loading: null,
  simDraft: null,
  collidingIds: [],

  setParts: (newParts, opts) =>
    set((s) => {
      const scad = opts?.scadSource
        ? { groupId: opts.groupId ?? newParts[0]?.groupId ?? '', source: opts.scadSource }
        : s.scad
      return {
        parts: [...s.parts, ...newParts],
        selectedId: newParts[0]?.id ?? s.selectedId,
        scad,
        params: opts?.params ?? s.params,
        measureA: null,
        measureB: null,
      }
    }),

  clearAll: () =>
    set({
      parts: [],
      selectedId: null,
      isolatedId: null,
      measureA: null,
      measureB: null,
      scad: null,
      params: [],
      simDraft: null,
      collidingIds: [],
      tool: 'orbit',
    }),

  select: (id) => set({ selectedId: id }),
  toggleVisible: (id) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)) })),
  setOpacity: (id, opacity) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, opacity } : p)) })),
  isolate: (id) => set({ isolatedId: id }),
  setTool: (tool) =>
    set((s) => ({
      tool,
      measureA: tool === 'measure' ? s.measureA : null,
      measureB: tool === 'measure' ? s.measureB : null,
    })),
  setUnit: (unit) => set({ unit }),
  toggleOrtho: () => set((s) => ({ ortho: !s.ortho })),
  setMeasurePoint: (p) =>
    set((s) => {
      if (!s.measureA || (s.measureA && s.measureB)) return { measureA: p, measureB: null }
      return { measureB: p }
    }),
  clearMeasure: () => set({ measureA: null, measureB: null }),
  setPartTransform: (id, patch) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  setSim: (id, sim) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, sim } : p)) })),
  setSimValue: (id, value) =>
    set((s) => ({
      parts: s.parts.map((p) => (p.id === id && p.sim ? { ...p, sim: { ...p.sim, value } } : p)),
    })),
  commandCamera: (type, view) =>
    set((s) => ({ cameraCommand: { id: (s.cameraCommand?.id ?? 0) + 1, type, view } })),
  setLoading: (msg) => set({ loading: msg }),
  setSimDraft: (draft) => set({ simDraft: draft }),
  setCollidingIds: (ids) =>
    set((s) => {
      if (s.collidingIds.length === ids.length && s.collidingIds.every((v, i) => v === ids[i])) return s
      return { collidingIds: ids }
    }),
  replaceGroup: (groupId, newParts, params) =>
    set((s) => ({
      parts: [
        ...s.parts.filter((p) => p.groupId !== groupId),
        ...newParts.map((p) => {
          const old = s.parts.find((o) => o.groupId === groupId && o.name === p.name)
          return old ? { ...p, visible: old.visible, opacity: old.opacity } : p
        }),
      ],
      params: params ?? s.params,
      selectedId: s.selectedId && s.parts.some((p) => p.id === s.selectedId && p.groupId !== groupId) ? s.selectedId : newParts[0]?.id ?? null,
    })),
}))

/* ---------- unit helpers ---------- */

const UNIT_FACTOR: Record<UnitName, number> = { mm: 1, cm: 0.1, m: 0.001, in: 1 / 25.4 }
const UNIT_LABEL: Record<UnitName, string> = { mm: 'mm', cm: 'cm', m: 'm', in: 'in' }

export function formatLength(mm: number, unit: UnitName, digits = 2): string {
  const v = mm * UNIT_FACTOR[unit]
  const abs = Math.abs(v)
  const d = abs >= 100 ? 1 : digits
  return `${v.toFixed(d)} ${UNIT_LABEL[unit]}`
}

export function unitLabel(unit: UnitName): string {
  return UNIT_LABEL[unit]
}
