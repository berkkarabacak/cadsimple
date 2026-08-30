import { useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Line,
  Html,
} from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useCad, formatLength } from '@/lib/store'
import { sceneBounds, viewDirection, fitDistance } from '@/lib/geom'
import { PartMesh } from './PartMesh'

/* ---------------- camera command rig ---------------- */

function CameraRig({ partRefs }: { partRefs: React.MutableRefObject<Map<string, THREE.Group>> }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const size = useThree((s) => s.size)
  const command = useCad((s) => s.cameraCommand)

  const applyFit = useCallback(
    (direction?: THREE.Vector3) => {
      const parts = useCad.getState().parts
      const bounds = sceneBounds(parts)
      if (!bounds || !controls) return
      const radius = Math.max(bounds.size.length() / 2, 1)
      const center = bounds.center

      const isOrtho = (camera as THREE.OrthographicCamera).isOrthographicCamera
      const aspect = size.width / Math.max(size.height, 1)
      let dist: number
      if (isOrtho) {
        const ortho = camera as THREE.OrthographicCamera
        const viewH = radius * 2 * 1.25
        ortho.zoom = Math.min(size.height / viewH, size.width / (viewH * aspect))
        ortho.updateProjectionMatrix()
        dist = radius * 4
      } else {
        const persp = camera as THREE.PerspectiveCamera
        dist = fitDistance(radius, persp.fov, aspect)
      }

      let dir: THREE.Vector3
      if (direction) {
        dir = direction
      } else {
        const current = camera.position.clone().sub(controls.target)
        dir = current.lengthSq() > 0.001 ? current.normalize() : viewDirection('iso')
      }
      camera.position.copy(center.clone().add(dir.clone().multiplyScalar(dist)))
      controls.target.copy(center)
      controls.update()
    },
    [camera, controls, size],
  )

  useEffect(() => {
    if (!command || !controls) return
    if (command.type === 'fit') {
      applyFit()
    } else if (command.type === 'reset') {
      applyFit(viewDirection('iso'))
    } else if (command.type === 'view' && command.view) {
      applyFit(viewDirection(command.view))
    } else if (command.type === 'zoomIn' || command.type === 'zoomOut') {
      const f = command.type === 'zoomIn' ? 1 / 1.35 : 1.35
      const offset = camera.position.clone().sub(controls.target).multiplyScalar(f)
      camera.position.copy(controls.target.clone().add(offset))
      controls.update()
    }
  }, [command, controls, applyFit, camera])

  /* collision detection between simulated parts and the rest */
  const lastCheck = useRef(0)
  const boxA = useRef(new THREE.Box3())
  const boxB = useRef(new THREE.Box3())
  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastCheck.current < 0.15) return
    lastCheck.current = clock.elapsedTime
    const { parts, setCollidingIds } = useCad.getState()
    const simmed = parts.filter((p) => p.sim && p.visible)
    if (simmed.length === 0) {
      setCollidingIds([])
      return
    }
    const hit = new Set<string>()
    for (const mover of simmed) {
      const objA = partRefs.current.get(mover.id)
      if (!objA) continue
      boxA.current.setFromObject(objA)
      for (const other of parts) {
        if (other.id === mover.id || !other.visible) continue
        const objB = partRefs.current.get(other.id)
        if (!objB) continue
        boxB.current.setFromObject(objB)
        if (boxA.current.intersectsBox(boxB.current)) {
          hit.add(mover.id)
          hit.add(other.id)
        }
      }
    }
    setCollidingIds([...hit])
  })

  return null
}

/* ---------------- measurement overlay ---------------- */

function MeasureOverlay() {
  const a = useCad((s) => s.measureA)
  const b = useCad((s) => s.measureB)
  const unit = useCad((s) => s.unit)
  if (!a) return null
  const dist = b ? Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) : 0
  return (
    <group>
      <mesh position={a}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" depthTest={false} />
      </mesh>
      {b && (
        <>
          <mesh position={b}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshBasicMaterial color="#22d3ee" depthTest={false} />
          </mesh>
          <Line points={[a, b]} color="#22d3ee" lineWidth={2} dashed dashSize={4} gapSize={2} />
          <Html position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} center zIndexRange={[10, 0]}>
            <div className="pointer-events-none select-none rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 whitespace-nowrap">
              {formatLength(dist, unit)}
            </div>
          </Html>
        </>
      )}
    </group>
  )
}

/* ---------------- pivot draft marker ---------------- */

function PivotDraftMarker() {
  const draft = useCad((s) => s.simDraft)
  if (!draft?.pivot) return null
  return (
    <mesh position={draft.pivot}>
      <sphereGeometry args={[1.6, 16, 16]} />
      <meshBasicMaterial color="#f472b6" depthTest={false} />
    </mesh>
  )
}

/* ---------------- main viewport ---------------- */

export function Viewport() {
  const parts = useCad((s) => s.parts)
  const tool = useCad((s) => s.tool)
  const ortho = useCad((s) => s.ortho)
  const select = useCad((s) => s.select)
  const partRefs = useRef(new Map<string, THREE.Group>())

  const registerRef = useCallback((id: string, obj: THREE.Group | null) => {
    if (obj) partRefs.current.set(id, obj)
    else partRefs.current.delete(id)
  }, [])

  const bounds = useMemo(() => sceneBounds(parts), [parts])
  const grid = useMemo(() => {
    if (!bounds) return { cell: 10, section: 100, y: 0, fade: 2000 }
    const radius = Math.max(bounds.size.length() / 2, 1)
    const cell = Math.pow(10, Math.floor(Math.log10(radius / 4)))
    return { cell, section: cell * 10, y: bounds.box.min.y - cell * 0.02, fade: radius * 12 }
  }, [bounds])

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ cursor: tool === 'measure' || tool === 'pickPivot' ? 'crosshair' : 'default' }}
      onPointerMissed={() => {
        if (tool === 'orbit' || tool === 'pan') select(null)
      }}
    >
      <color attach="background" args={['#0a0f16']} />

      <PerspectiveCamera makeDefault={!ortho} fov={42} near={0.1} far={100000} position={[320, 240, 320]} />
      <OrthographicCamera makeDefault={ortho} zoom={1.5} near={-100000} far={100000} position={[320, 240, 320]} />

      <hemisphereLight args={['#cbd5e1', '#1e293b', 0.9]} />
      <directionalLight position={[400, 600, 300]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-300, 200, -250]} intensity={0.5} color="#a5b4fc" />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        mouseButtons={{
          LEFT: tool === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />

      <Grid
        position={[0, grid.y, 0]}
        args={[10, 10]}
        cellSize={grid.cell}
        sectionSize={grid.section}
        cellColor="#1e293b"
        sectionColor="#334155"
        cellThickness={0.6}
        sectionThickness={1.1}
        fadeDistance={grid.fade}
        fadeStrength={2}
        infiniteGrid
      />

      <CameraRig partRefs={partRefs} />

      {parts.map((p) => (
        <PartMesh key={p.id} part={p} registerRef={registerRef} />
      ))}

      <MeasureOverlay />
      <PivotDraftMarker />

      <GizmoHelper alignment="bottom-left" margin={[64, 64]}>
        <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="#e2e8f0" />
      </GizmoHelper>
    </Canvas>
  )
}
