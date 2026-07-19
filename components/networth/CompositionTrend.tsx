'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Layers } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatAxisINR, formatCompactINR } from '@/lib/format'
import { MonthData } from '@/lib/netWorth'
import { RANGES, RangeKey } from './range'

interface CompositionTrendProps {
  months: MonthData[] // most-recent-first (API order)
  range: RangeKey
  selectedMonth: string
}

// Fixed type -> color mapping so a band keeps its colour across time.
const TYPE_COLORS: Record<string, string> = {
  Investment: '#6366f1',
  'Liquid Asset': '#0ea5e9',
  PF: '#14b8a6',
  'Non-liquid': '#f59e0b',
  'Other Asset': '#a78bfa',
  Depreciating: '#f472b6',
}
const FALLBACK_COLORS = ['#64748b', '#f97316', '#84cc16', '#e11d48']
const TYPE_ORDER = ['Investment', 'Liquid Asset', 'PF', 'Non-liquid', 'Other Asset', 'Depreciating']

export function CompositionTrend({ months, range, selectedMonth }: CompositionTrendProps) {
  const { theme } = useTheme()
  const { hidden } = usePrivacy()
  const isDark = theme === 'dark'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'

  const { data, types } = useMemo(() => {
    const chrono = [...months].reverse()
    const cfg = RANGES.find((r) => r.key === range)!
    const endIdx = (() => {
      const i = chrono.findIndex((m) => m.month === selectedMonth)
      return i === -1 ? chrono.length - 1 : i
    })()
    const windowLen = cfg.months === null ? endIdx + 1 : Math.min(cfg.months + 1, endIdx + 1)
    const startIdx = Math.max(0, endIdx - (windowLen - 1))
    const windowMonths = chrono.slice(startIdx, endIdx + 1)

    const typeSet = new Set<string>()
    for (const m of windowMonths) {
      for (const [t, v] of Object.entries(m.assetsByType)) if (v > 0) typeSet.add(t)
    }
    const types = TYPE_ORDER.filter((t) => typeSet.has(t)).concat(
      Array.from(typeSet).filter((t) => !TYPE_ORDER.includes(t)),
    )

    const data = windowMonths.map((m) => {
      const row: Record<string, number | string> = { month: m.month }
      for (const t of types) row[t] = m.assetsByType[t] || 0
      return row
    })
    return { data, types }
  }, [months, range, selectedMonth])

  const colorFor = (type: string, i: number) => TYPE_COLORS[type] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]

  if (data.length < 2) return null

  return (
    <section className="nw-card p-5" aria-label="Asset composition over time">
      <div className="flex items-center gap-2.5 mb-4">
        <Layers className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Asset Composition</h2>
          <p className="text-xs nw-text-muted">How your mix has shifted over time</p>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(v: string) => v.split(' ')[0]}
              axisLine={false}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(v: number) => (hidden ? '•••' : formatAxisINR(v))}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CompTooltip isDark={isDark} hidden={hidden} colorFor={colorFor} types={types} />} />
            {types.map((t, i) => (
              <Area
                key={t}
                type="monotone"
                dataKey={t}
                stackId="1"
                stroke={colorFor(t, i)}
                fill={colorFor(t, i)}
                fillOpacity={isDark ? 0.5 : 0.35}
                strokeWidth={1}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {types.map((t, i) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-xs nw-text-secondary">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorFor(t, i) }} />
            {t}
          </span>
        ))}
      </div>
    </section>
  )
}

function CompTooltip({ active, payload, label, isDark, hidden, colorFor, types }: any) {
  if (!active || !payload || !payload.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{
        background: isDark ? '#1e2430' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
      }}
    >
      <p className="mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</p>
      {[...payload].reverse().map((p: any) => {
        const idx = types.indexOf(p.dataKey)
        return (
          <p key={p.dataKey} className="tabnums flex items-center justify-between gap-3" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: colorFor(p.dataKey, idx) }} />
              {p.dataKey}
            </span>
            <span>{hidden ? '••••' : formatCompactINR(p.value, 1)}</span>
          </p>
        )
      })}
      <p className="tabnums mt-1 pt-1 border-t flex items-center justify-between gap-3" style={{ borderColor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)', color: isDark ? '#e6eaf0' : '#0f172a' }}>
        <span className="font-medium">Total</span>
        <span className="font-semibold">{hidden ? '••••' : formatCompactINR(total, 1)}</span>
      </p>
    </div>
  )
}
