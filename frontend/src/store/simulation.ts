import { create } from 'zustand'
import type { SimMode, SimulationParams, Particle, SimulationStats } from '../types'

const COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c084fc','#f472b6','#38bdf8']

function randomParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
    ] as [number, number, number],
    velocity: [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ] as [number, number, number],
    mass: 0.5 + Math.random() * 2,
    color: COLORS[i % COLORS.length],
    radius: 0.15 + Math.random() * 0.35,
  }))
}

const initialStats: SimulationStats = {
  speedDistribution: Array.from({ length: 8 }, (_, i) => ({ min: i, max: i + 1, count: 0 })),
  avgSpeed: 0,
  maxSpeed: 0,
  collisionsPerFrame: 0,
  totalCollisions: 0,
  regionDensity: [
    { region: '上+前+左', count: 0, percentage: 0 },
    { region: '上+前+右', count: 0, percentage: 0 },
    { region: '上+后+左', count: 0, percentage: 0 },
    { region: '上+后+右', count: 0, percentage: 0 },
    { region: '下+前+左', count: 0, percentage: 0 },
    { region: '下+前+右', count: 0, percentage: 0 },
    { region: '下+后+左', count: 0, percentage: 0 },
    { region: '下+后+右', count: 0, percentage: 0 },
  ],
  avgKineticEnergy: 0,
  momentum: [0, 0, 0],
}

interface SimStore extends SimulationParams {
  particles: Particle[]
  fps: number
  totalEnergy: number
  stats: SimulationStats
  setMode: (mode: SimMode) => void
  setParticleCount: (count: number) => void
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void
  reset: () => void
  setFps: (fps: number) => void
  setTotalEnergy: (e: number) => void
  applyPreset: (preset: Partial<SimulationParams>) => void
  setStats: (stats: SimulationStats) => void
  resetStats: () => void
}

export const useSimStore = create<SimStore>((set, get) => ({
  mode: 'gravity',
  particleCount: 300,
  gravity: 9.8,
  damping: 0.02,
  bounce: 0.7,
  attractorStrength: 5,
  slowMotion: false,
  paused: false,
  particles: randomParticles(300),
  fps: 0,
  totalEnergy: 0,
  stats: initialStats,
  setMode: (mode) => set({ mode }),
  setParticleCount: (count) => set({ particleCount: count, particles: randomParticles(count) }),
  setParam: (key, value) => set({ [key]: value } as any),
  reset: () => {
    const { particleCount } = get()
    set({ particles: randomParticles(particleCount) })
  },
  setFps: (fps) => set({ fps }),
  setTotalEnergy: (e) => set({ totalEnergy: e }),
  applyPreset: (preset) => {
    set({ ...preset } as any)
    const { particleCount } = get()
    set({ particles: randomParticles(particleCount) })
  },
  setStats: (stats) => set({ stats }),
  resetStats: () => set({ stats: initialStats }),
}))
