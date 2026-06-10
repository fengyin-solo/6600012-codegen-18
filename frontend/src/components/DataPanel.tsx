import { useState } from 'react'
import { useSimStore } from '../store/simulation'

type TabKey = 'speed' | 'collision' | 'density'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'speed', label: '速度分布', icon: '⚡' },
  { key: 'collision', label: '碰撞统计', icon: '💥' },
  { key: 'density', label: '区域密度', icon: '📊' },
]

function formatNumber(n: number, digits = 2) {
  if (!isFinite(n)) return '0'
  return n.toFixed(digits)
}

function SpeedDistributionPanel() {
  const stats = useSimStore(s => s.stats)
  const { speedDistribution, avgSpeed, maxSpeed } = stats
  const maxCount = Math.max(...speedDistribution.map(b => b.count), 1)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-900/40 border border-blue-500/30 rounded-lg p-3">
          <div className="text-xs text-blue-300 mb-1">平均速度</div>
          <div className="text-xl font-bold text-blue-400 font-mono">{formatNumber(avgSpeed)}</div>
          <div className="text-[10px] text-blue-400/60">单位/秒</div>
        </div>
        <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-3">
          <div className="text-xs text-purple-300 mb-1">最大速度</div>
          <div className="text-xl font-bold text-purple-400 font-mono">{formatNumber(maxSpeed)}</div>
          <div className="text-[10px] text-purple-400/60">单位/秒</div>
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-2 flex justify-between">
          <span>速度区间分布</span>
          <span className="text-gray-500">共 {speedDistribution.length} 段</span>
        </div>
        <div className="space-y-2">
          {speedDistribution.map((bucket, idx) => {
            const pct = (bucket.count / maxCount) * 100
            const isMax = bucket.count === maxCount && bucket.count > 0
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-20 text-right text-[10px] text-gray-400 font-mono whitespace-nowrap">
                  [{formatNumber(bucket.min, 1)}–{formatNumber(bucket.max, 1)})
                </div>
                <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isMax ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-blue-600/70'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] text-white font-mono">
                    {bucket.count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CollisionPanel() {
  const stats = useSimStore(s => s.stats)
  const particleCount = useSimStore(s => s.particleCount)
  const resetStats = useSimStore(s => s.resetStats)
  const { collisionsPerFrame, totalCollisions, avgKineticEnergy, momentum } = stats

  const collisionRate = particleCount > 0 ? (collisionsPerFrame / particleCount) * 100 : 0
  const momentumMag = Math.sqrt(momentum[0] ** 2 + momentum[1] ** 2 + momentum[2] ** 2)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-3">
          <div className="text-xs text-red-300 mb-1">本帧碰撞</div>
          <div className="text-xl font-bold text-red-400 font-mono">{collisionsPerFrame}</div>
          <div className="text-[10px] text-red-400/60">次/帧 (采样)</div>
        </div>
        <div className="bg-orange-900/40 border border-orange-500/30 rounded-lg p-3">
          <div className="text-xs text-orange-300 mb-1">累计碰撞</div>
          <div className="text-xl font-bold text-orange-400 font-mono">{totalCollisions.toLocaleString()}</div>
          <div className="text-[10px] text-orange-400/60">次 (总)</div>
        </div>
      </div>

      <div className="bg-gray-800/60 border border-gray-600/30 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">碰撞频率</span>
          <span className="text-sm font-mono text-red-300">{formatNumber(collisionRate, 1)} %</span>
        </div>
        <div className="h-2 bg-gray-900 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-300"
            style={{ width: `${Math.min(collisionRate, 100)}%` }}
          />
        </div>
      </div>

      <div className="bg-gray-800/60 border border-gray-600/30 rounded-lg p-3 space-y-2">
        <div className="text-xs text-gray-400 mb-2">能量与动量</div>
        <div className="flex justify-between">
          <span className="text-xs text-yellow-400/80">平均动能</span>
          <span className="text-sm font-mono text-yellow-300">{formatNumber(avgKineticEnergy)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-cyan-400/80">系统动量</span>
          <span className="text-sm font-mono text-cyan-300">{formatNumber(momentumMag)}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <div className="text-[10px] text-gray-500 text-center">
            X: <span className="text-cyan-400 font-mono">{formatNumber(momentum[0], 1)}</span>
          </div>
          <div className="text-[10px] text-gray-500 text-center">
            Y: <span className="text-cyan-400 font-mono">{formatNumber(momentum[1], 1)}</span>
          </div>
          <div className="text-[10px] text-gray-500 text-center">
            Z: <span className="text-cyan-400 font-mono">{formatNumber(momentum[2], 1)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={resetStats}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs transition"
      >
        🔄 重置统计数据
      </button>
    </div>
  )
}

function DensityPanel() {
  const stats = useSimStore(s => s.stats)
  const { regionDensity } = stats
  const maxPct = Math.max(...regionDensity.map(r => r.percentage), 1)

  const getColor = (pct: number) => {
    if (pct > 20) return 'from-rose-500 to-pink-400'
    if (pct > 12) return 'from-amber-500 to-yellow-400'
    if (pct > 6) return 'from-emerald-500 to-green-400'
    return 'from-sky-500 to-blue-400'
  }

  const sorted = [...regionDensity].sort((a, b) => b.count - a.count)
  const hottest = sorted[0]
  const coldest = sorted[sorted.length - 1]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-900/40 border border-rose-500/30 rounded-lg p-3">
          <div className="text-xs text-rose-300 mb-1">最密集区域</div>
          <div className="text-sm font-bold text-rose-300">{hottest?.region || '-'}</div>
          <div className="text-[10px] text-rose-400/70 mt-1">
            {hottest?.count || 0} 粒 ({formatNumber(hottest?.percentage || 0)}%)
          </div>
        </div>
        <div className="bg-sky-900/40 border border-sky-500/30 rounded-lg p-3">
          <div className="text-xs text-sky-300 mb-1">最稀疏区域</div>
          <div className="text-sm font-bold text-sky-300">{coldest?.region || '-'}</div>
          <div className="text-[10px] text-sky-400/70 mt-1">
            {coldest?.count || 0} 粒 ({formatNumber(coldest?.percentage || 0)}%)
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-2">空间八分体密度</div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="text-[10px] text-gray-500 text-center bg-gray-800/50 py-1 rounded">上方 (Y+)</div>
          <div className="text-[10px] text-gray-500 text-center bg-gray-800/50 py-1 rounded">下方 (Y-)</div>
        </div>

        {[0, 1].map(row => (
          <div key={row} className="grid grid-cols-2 gap-2 mb-2">
            {[row, row + 4].map(baseIdx => (
              <div key={baseIdx} className="space-y-2">
                <div className="text-[10px] text-gray-500 flex justify-between px-1">
                  <span>Z+</span>
                  <span>Z-</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[0, 2].map(offset => {
                    const idx = baseIdx + offset
                    const r = regionDensity[idx]
                    const width = (r.percentage / maxPct) * 100
                    return (
                      <div
                        key={idx}
                        className="bg-gray-800/80 rounded p-2 border border-gray-700/50 relative overflow-hidden"
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getColor(r.percentage)} opacity-30 transition-all duration-500`}
                          style={{ clipPath: `inset(${100 - width}% 0 0 0)` }}
                        />
                        <div className="relative text-[10px] text-gray-300 font-medium">
                          {r.region.includes('左') ? '←' : '→'} X
                        </div>
                        <div className="relative text-lg font-bold font-mono text-white">
                          {r.count}
                        </div>
                        <div className="relative text-[9px] text-gray-400">
                          {formatNumber(r.percentage, 1)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-between text-[9px] text-gray-500 pt-2 border-t border-gray-700/50">
        <span>图例:</span>
        <span className="text-sky-400">■ 低</span>
        <span className="text-green-400">■ 中低</span>
        <span className="text-amber-400">■ 中高</span>
        <span className="text-rose-400">■ 高</span>
      </div>
    </div>
  )
}

export default function DataPanel() {
  const [tab, setTab] = useState<TabKey>('speed')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={`absolute top-3 right-3 transition-all duration-300 ${
        collapsed ? 'w-10' : 'w-80'
      }`}
    >
      <div className="bg-gray-900/90 backdrop-blur rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <span className="text-sm font-semibold text-white">数据面板</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 transition ml-auto"
            title={collapsed ? '展开' : '收起'}
          >
            {collapsed ? '◀' : '▶'}
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="flex border-b border-gray-700">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 px-2 py-2 text-xs font-medium transition ${
                    tab === t.key
                      ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <span className="mr-1">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-3 max-h-[calc(100vh-180px)] overflow-y-auto">
              {tab === 'speed' && <SpeedDistributionPanel />}
              {tab === 'collision' && <CollisionPanel />}
              {tab === 'density' && <DensityPanel />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
