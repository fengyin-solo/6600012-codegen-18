import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../store/simulation'
import { applyPhysics } from '../simulations/physics'
import type { SimulationStats } from '../types'

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()
const SPEED_BUCKETS = 8
const REGION_NAMES = [
  '上+前+左', '上+前+右', '上+后+左', '上+后+右',
  '下+前+左', '下+前+右', '下+后+左', '下+后+右',
]

export default function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useSimStore(s => s.particles)
  const mode = useSimStore(s => s.mode)
  const gravity = useSimStore(s => s.gravity)
  const damping = useSimStore(s => s.damping)
  const bounce = useSimStore(s => s.bounce)
  const attractorStrength = useSimStore(s => s.attractorStrength)
  const slowMotion = useSimStore(s => s.slowMotion)
  const paused = useSimStore(s => s.paused)
  const setFps = useSimStore(s => s.setFps)
  const setTotalEnergy = useSimStore(s => s.setTotalEnergy)
  const setStats = useSimStore(s => s.setStats)

  const colorArray = useMemo(
    () => new Float32Array(particles.length * 3),
    [particles.length]
  )

  useMemo(() => {
    particles.forEach((p, i) => {
      tempColor.set(p.color)
      colorArray[i * 3] = tempColor.r
      colorArray[i * 3 + 1] = tempColor.g
      colorArray[i * 3 + 2] = tempColor.b
    })
  }, [particles, colorArray])

  const fpsCounter = useRef({ frames: 0, lastTime: performance.now() })
  const statsCounter = useRef({ frames: 0 })
  const totalCollisionsRef = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current || paused) return
    const dt = slowMotion ? delta * 0.1 : delta
    const result = applyPhysics(particles, mode, gravity, damping, bounce, attractorStrength, dt)
    const updated = result.particles

    let totalEnergy = 0
    let sumSpeed = 0
    let maxSpeed = 0
    let momentumX = 0, momentumY = 0, momentumZ = 0
    const speedCounts = new Array(SPEED_BUCKETS).fill(0)
    const regionCounts = new Array(8).fill(0)
    const bucketSize = 1.5

    updated.forEach((p, i) => {
      tempObject.position.set(...p.position)
      const scale = p.radius * 2
      tempObject.scale.set(scale, scale, scale)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)

      const vx = p.velocity[0], vy = p.velocity[1], vz = p.velocity[2]
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
      const ke = 0.5 * p.mass * (vx * vx + vy * vy + vz * vz)
      totalEnergy += ke
      sumSpeed += speed
      if (speed > maxSpeed) maxSpeed = speed

      momentumX += p.mass * vx
      momentumY += p.mass * vy
      momentumZ += p.mass * vz

      const bucketIdx = Math.min(Math.floor(speed / bucketSize), SPEED_BUCKETS - 1)
      speedCounts[bucketIdx]++

      const rIdx = (p.position[1] > 0 ? 0 : 4) + (p.position[2] > 0 ? 0 : 2) + (p.position[0] > 0 ? 1 : 0)
      regionCounts[rIdx]++
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    setTotalEnergy(totalEnergy)

    statsCounter.current.frames++
    totalCollisionsRef.current += result.collisions

    if (statsCounter.current.frames >= 3) {
      statsCounter.current.frames = 0
      const count = updated.length || 1
      const prevTotalCollisions = useSimStore.getState().stats.totalCollisions
      const newStats: SimulationStats = {
        speedDistribution: speedCounts.map((c, i) => ({
          min: i * bucketSize,
          max: (i + 1) * bucketSize,
          count: c,
        })),
        avgSpeed: sumSpeed / count,
        maxSpeed,
        collisionsPerFrame: Math.round(totalCollisionsRef.current / 3),
        totalCollisions: prevTotalCollisions + totalCollisionsRef.current,
        regionDensity: REGION_NAMES.map((name, i) => ({
          region: name,
          count: regionCounts[i],
          percentage: (regionCounts[i] / count) * 100,
        })),
        avgKineticEnergy: totalEnergy / count,
        momentum: [momentumX, momentumY, momentumZ],
      }
      totalCollisionsRef.current = 0
      setStats(newStats)
    }

    fpsCounter.current.frames++
    const now = performance.now()
    if (now - fpsCounter.current.lastTime > 1000) {
      setFps(fpsCounter.current.frames)
      fpsCounter.current.frames = 0
      fpsCounter.current.lastTime = now
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </sphereGeometry>
      <meshPhongMaterial vertexColors toneMapped={false} shininess={80} />
    </instancedMesh>
  )
}
