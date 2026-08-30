import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, RoundedBox } from '@react-three/drei'

function HingeAssembly() {
  const leaf = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!leaf.current) return
    // door leaf slowly opens and closes
    leaf.current.rotation.y = (Math.sin(clock.elapsedTime * 0.7) * 0.5 + 0.5) * THREE.MathUtils.degToRad(100)
  })

  return (
    <group rotation={[0.35, 0, 0]}>
      {/* base plate */}
      <RoundedBox args={[90, 8, 44]} radius={2.5} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#38bdf8" roughness={0.35} metalness={0.2} />
      </RoundedBox>
      {/* mounting posts */}
      {[[-32, -14], [-32, 14], [32, -14], [32, 14]].map(([x, z], i) => (
        <mesh key={i} position={[x, 8, z]} castShadow>
          <cylinderGeometry args={[4, 4, 8, 24]} />
          <meshStandardMaterial color="#818cf8" roughness={0.4} metalness={0.25} />
        </mesh>
      ))}
      {/* hinge barrel */}
      <mesh position={[0, 8, -26]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[6, 6, 56, 32]} />
        <meshStandardMaterial color="#f0abfc" roughness={0.3} metalness={0.35} />
      </mesh>
      {/* animated door leaf */}
      <group position={[0, 8, -26]} ref={leaf}>
        <RoundedBox args={[70, 5, 40]} radius={2} position={[0, 0, -20]} castShadow>
          <meshStandardMaterial color="#5eead4" roughness={0.4} metalness={0.15} />
        </RoundedBox>
      </group>
    </group>
  )
}

export function HeroCanvas() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [150, 110, 150], fov: 38 }}>
      <color attach="background" args={['#0a0f16']} />
      <hemisphereLight args={['#cbd5e1', '#1e293b', 0.9]} />
      <directionalLight position={[120, 180, 90]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-100, 60, -80]} intensity={0.5} color="#a5b4fc" />
      <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.5}>
        <HingeAssembly />
      </Float>
      {/* soft ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -14, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.9}
        enableDamping
        dampingFactor={0.1}
      />
    </Canvas>
  )
}
