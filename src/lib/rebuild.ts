import { useCad } from './store'
import { compileScad } from './scad'

let timer: ReturnType<typeof setTimeout> | null = null

/** Recompile the current SCAD source with a parameter override (debounced). */
export function applyParam(name: string, value: number) {
  const s = useCad.getState()
  useCad.setState({
    params: s.params.map((p) => (p.name === name ? { ...p, value } : p)),
  })
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    const state = useCad.getState()
    if (!state.scad) return
    const overrides = Object.fromEntries(state.params.map((p) => [p.name, p.value]))
    try {
      const { parts } = compileScad(state.scad.source, state.scad.groupId, overrides)
      state.replaceGroup(state.scad.groupId, parts)
    } catch (err) {
      console.warn('SCAD rebuild failed:', err)
    }
  }, 120)
}
