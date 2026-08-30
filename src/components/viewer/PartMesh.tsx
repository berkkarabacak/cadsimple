import { useMemo } from 'react'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useCad, type Part, type Vec3 } from '@/lib/store'

interface Props {
  part: Part
  registerRef: (id: string, obj: THREE.Group | null) => void
}

const DEG = THREE.MathUtils.degToRad

export function PartMesh({ part, registerRef }: Props) {
  const selectedId = useCad((s) => s.selectedId)
  const isolatedId = useCad((s) => s.isolatedId)
  const tool = useCad((s) => s.tool)
  const colliding = useCad((s) => s.collidingIds.includes(part.id))
  const select = useCad((s) => s.select)
  const setMeasurePoint = useCad((s) => s.setMeasurePoint)
  const simDraft = useCad((s) => s.simDraft)
  const setSimDraft = useCad((s) => s.setSimDraft)

  const selected = selectedId === part.id
  const hiddenByIsolation = isolatedId !== null && isolatedId !== part.id

  const pivotMarkerSize = useMemo(() => {
    part.geometry.computeBoundingSphere()
    return Math.max((part.geometry.boundingSphere?.radius ?? 50) * 0.02, 0.5)
  }, [part.geometry])

  if (!part.visible || hiddenByIsolation) return null

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const p: Vec3 = [e.point.x, e.point.y, e.point.z]
    if (tool === 'measure') {
      setMeasurePoint(p)
      return
    }
    if (tool === 'pickPivot' && simDraft) {
      setSimDraft({ ...simDraft, pivot: p })
      return
    }
    select(part.id)
  }

  const transparent = part.opacity < 1

  const mesh = (
    <mesh geometry={part.geometry} onClick={handleClick} castShadow receiveShadow>
      <meshStandardMaterial
        color={part.color}
        roughness={0.45}
        metalness={0.15}
        transparent={transparent}
        opacity={part.opacity}
        side={THREE.DoubleSide}
        emissive={colliding ? '#ef4444' : selected ? '#164e63' : '#000000'}
        emissiveIntensity={colliding ? 0.7 : selected ? 0.5 : 0}
      />
      {selected && <Edges scale={1.002} color="#22d3ee" lineWidth={1.5} />}
    </mesh>
  )

  const base = (
    <group
      key="base"
      position={part.position}
      rotation={[DEG(part.rotation[0]), DEG(part.rotation[1]), DEG(part.rotation[2])]}
    >
      {mesh}
    </group>
  )

  let content = base
  if (part.sim) {
    const sim = part.sim
    if (sim.type === 'rotate') {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(...sim.axis).normalize(),
        DEG(sim.value),
      )
      const e = new THREE.Euler().setFromQuaternion(q)
      content = (
        <group key="sim-rotate" position={sim.pivot}>
          <group rotation={e}>
            <group position={[-sim.pivot[0], -sim.pivot[1], -sim.pivot[2]]}>{base}</group>
          </group>
        </group>
      )
    } else {
      const dir = new THREE.Vector3(...sim.axis).normalize().multiplyScalar(sim.value)
      content = (
        <group key="sim-slide" position={[dir.x, dir.y, dir.z]}>
          {base}
        </group>
      )
    }
  }

  return (
    <>
      <group ref={(o) => registerRef(part.id, o)}>{content}</group>
      {selected && part.sim && part.sim.type === 'rotate' && (
        <mesh position={part.sim.pivot}>
          <sphereGeometry args={[pivotMarkerSize, 16, 16]} />
          <meshBasicMaterial color="#f472b6" depthTest={false} transparent opacity={0.9} />
        </mesh>
      )}
    </>
  )
}
