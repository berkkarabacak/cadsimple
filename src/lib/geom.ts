import * as THREE from 'three'
import type { Part, Vec3, ViewName } from './store'

/** Approximate world-space bounding box of all visible parts (base transform only). */
export function sceneBounds(parts: Part[]): { box: THREE.Box3; center: THREE.Vector3; size: THREE.Vector3 } | null {
  const box = new THREE.Box3()
  let any = false
  const tmp = new THREE.Box3()
  for (const p of parts) {
    if (!p.visible) continue
    p.geometry.computeBoundingBox()
    if (!p.geometry.boundingBox) continue
    tmp.copy(p.geometry.boundingBox)
    const m = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(
        THREE.MathUtils.degToRad(p.rotation[0]),
        THREE.MathUtils.degToRad(p.rotation[1]),
        THREE.MathUtils.degToRad(p.rotation[2]),
      ),
    )
    m.setPosition(p.position[0], p.position[1], p.position[2])
    tmp.applyMatrix4(m)
    box.union(tmp)
    any = true
  }
  if (!any) return null
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  return { box, center, size }
}

const VIEW_DIRS: Record<ViewName, Vec3> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  iso: [1, 0.8, 1],
}

export function viewDirection(view: ViewName): THREE.Vector3 {
  const v = new THREE.Vector3(...VIEW_DIRS[view])
  return v.normalize()
}

/** Distance needed to fit `radius` in view for a perspective camera. */
export function fitDistance(radius: number, fovDeg: number, aspect: number): number {
  const fov = THREE.MathUtils.degToRad(fovDeg)
  const fitH = radius / Math.tan(fov / 2)
  const fitW = fitH / Math.max(aspect, 0.01)
  return Math.max(fitH, fitW) * 1.35
}

export function partSize(p: Part): Vec3 {
  p.geometry.computeBoundingBox()
  const b = p.geometry.boundingBox
  if (!b) return [0, 0, 0]
  const s = b.getSize(new THREE.Vector3())
  return [s.x, s.y, s.z]
}
