'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PieChart, Layers } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { formatAxisINR, formatCompactINR } from '@/lib/format'
import { ASSET_CLASS_LABELS, ASSET_CLASS_ORDER, AssetClassId, ForecastResult } from '@/lib/forecast/types'

const ASSET_COLORS: Record<AssetClassId, string> = {
  cash: '#64748b',
  mutualFunds: '#6366f1',
  stocks: '#0ea5e9',
  rsu: '#8b5cf6',
  pf: '#14b8a6',
  realEstate: '#f59e0b',
  gold: '#eab308',
  crypto: '#ec4899',
  vehicle: '#a3a3a3',
  other: '#22c55e',
}

function useChartTheme() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return {
    isDark,
    gridColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)',
    axisColor: isDark ? '#64748b' : '#94a3b8',
  }
}

/** Stacked composition of net worth by asset class over the forecast horizon. */
export function CompositionChart({ result }: { result: ForecastResult }) {
  const { isDark, gridColor, axisColor } = useChartTheme()

  const { data, classes } = useMemo(() => {
    const present = ASSET_CLASS_ORDER.filter((id) =>
      result.monthly.some((p) => Math.abs(p.valueByAsset[id]) > 1),
    )
    const rows = result.monthly.map((p) => {
      const row: Record<string, number | string> = { date: p.date }
      for (const id of present) row[id] = p.valueByAsset[id]
      return row
    })
    return { data: rows, classes: present }
  }, [result])

  return (
    <section className="nw-card p-5" aria-label="Net worth composition over time">
      <div className="flex items-center gap-2.5 mb-4">
        <Layers className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Composition Over Time</h2>
          <p className="text-xs nw-text-muted">How the mix of assets evolves as you invest and compound.</p>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v: string) => v.split(' ')[1] ?? v} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v: number) => formatAxisINR(v)} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<StackTooltip isDark={isDark} labelFor={(k: string) => ASSET_CLASS_LABELS[k as AssetClassId]} />} />
            <Legend formatter={(id) => ASSET_CLASS_LABELS[id as AssetClassId]} wrapperStyle={{ fontSize: 12 }} />
            {classes.map((id) => (
              <Area
                key={id}
                type="monotone"
                dataKey={id}
                stackId="composition"
                stroke={ASSET_COLORS[id]}
                fill={ASSET_COLORS[id]}
                fillOpacity={isDark ? 0.5 : 0.65}
                strokeWidth={1}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

/** How much of the projected net worth comes from saving vs. market growth. */
export function AttributionChart({ result }: { result: ForecastResult }) {
  const { isDark, gridColor, axisColor } = useChartTheme()

  const data = useMemo(
    () =>
      result.monthly.map((p) => ({
        date: p.date,
        starting: result.startNetWorth,
        contributions: p.cumulativeContributions,
        market: p.cumulativeReturns - p.cumulativeDepreciation,
      })),
    [result],
  )

  const LABELS: Record<string, string> = {
    starting: 'Starting net worth',
    contributions: 'Money you add',
    market: 'Market growth',
  }
  const COLORS: Record<string, string> = { starting: '#94a3b8', contributions: '#6366f1', market: '#10b981' }

  return (
    <section className="nw-card p-5" aria-label="Contributions versus market growth">
      <div className="flex items-center gap-2.5 mb-4">
        <PieChart className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Saving vs. Market Growth</h2>
          <p className="text-xs nw-text-muted">What builds your net worth: money you add vs. compounding returns.</p>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v: string) => v.split(' ')[1] ?? v} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v: number) => formatAxisINR(v)} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<StackTooltip isDark={isDark} labelFor={(k: string) => LABELS[k] ?? k} />} />
            <Legend formatter={(id) => LABELS[id] ?? id} wrapperStyle={{ fontSize: 12 }} />
            {(['starting', 'contributions', 'market'] as const).map((k) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stackId="attr"
                stroke={COLORS[k]}
                fill={COLORS[k]}
                fillOpacity={isDark ? 0.4 : 0.55}
                strokeWidth={1}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function StackTooltip({ active, payload, label, isDark, labelFor }: any) {
  if (!active || !payload || !payload.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{
        background: isDark ? '#1e2430' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
      }}
    >
      <p className="mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</p>
      {[...payload].reverse().map((p: any) => (
        <p key={p.dataKey} className="tabnums flex items-center gap-2" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {labelFor(p.dataKey)}
          <span className="ml-auto font-medium">{formatCompactINR(p.value)}</span>
        </p>
      ))}
      <p className="tabnums flex items-center gap-2 mt-1 pt-1 border-t" style={{ borderColor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)', color: isDark ? '#e6eaf0' : '#0f172a' }}>
        Total<span className="ml-auto font-semibold">{formatCompactINR(total)}</span>
      </p>
    </div>
  )
}
