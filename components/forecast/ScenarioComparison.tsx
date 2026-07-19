'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GitCompareArrows } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { formatAxisINR, formatCompactINR, formatSignedPercent } from '@/lib/format'
import { runForecast } from '@/lib/forecast/engine'
import { ForecastScenario } from '@/lib/forecast/types'

interface ScenarioComparisonProps {
  scenarios: ForecastScenario[]
  startDate: { month: number; year: number }
  horizonYears: number
  horizonLabel: string
}

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7']

export function ScenarioComparison({
  scenarios,
  startDate,
  horizonYears,
  horizonLabel,
}: ScenarioComparisonProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'

  const [selected, setSelected] = useState<string[]>([])

  // Default: compare the built-in presets; keep selection valid as scenarios change.
  useEffect(() => {
    setSelected((prev) => {
      const valid = prev.filter((id) => scenarios.some((s) => s.id === id))
      if (valid.length > 0) return valid
      const builtIns = scenarios.filter((s) => s.builtIn).map((s) => s.id)
      return builtIns.length ? builtIns : scenarios.slice(0, 3).map((s) => s.id)
    })
  }, [scenarios])

  const chosen = useMemo(
    () => scenarios.filter((s) => selected.includes(s.id)),
    [scenarios, selected],
  )

  const runs = useMemo(
    () =>
      chosen.map((s, i) => ({
        scenario: s,
        color: PALETTE[i % PALETTE.length],
        result: runForecast({ assumptions: s.assumptions, startDate, months: horizonYears * 12 }),
      })),
    [chosen, startDate, horizonYears],
  )

  const data = useMemo(() => {
    if (runs.length === 0) return []
    const len = runs[0].result.monthly.length
    const rows: Record<string, number | string>[] = []
    for (let i = 0; i < len; i++) {
      const row: Record<string, number | string> = { date: runs[0].result.monthly[i].date }
      for (const run of runs) row[run.scenario.id] = run.result.monthly[i]?.netWorth ?? 0
      rows.push(row)
    }
    return rows
  }, [runs])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <section className="nw-card p-5" aria-label="Scenario comparison">
      <div className="flex items-center gap-2.5 mb-4">
        <GitCompareArrows className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Compare Scenarios</h2>
          <p className="text-xs nw-text-muted">Projected net worth over {horizonLabel}, side by side.</p>
        </div>
      </div>

      {/* Scenario toggles */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {scenarios.map((s) => {
          const on = selected.includes(s.id)
          const idx = chosen.findIndex((c) => c.id === s.id)
          const color = on && idx >= 0 ? PALETTE[idx % PALETTE.length] : undefined
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              data-active={on}
              className="nw-control inline-flex items-center gap-1.5 px-2.5 py-1 text-xs whitespace-nowrap"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border"
                style={{ background: color ?? 'transparent', borderColor: color ?? axisColor }}
              />
              {s.name}
            </button>
          )
        })}
      </div>

      {runs.length === 0 ? (
        <p className="text-sm nw-text-secondary py-8 text-center">Select at least one scenario to compare.</p>
      ) : (
        <>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickFormatter={(v: string) => v.split(' ')[1] ?? v}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickFormatter={(v: number) => formatAxisINR(v)}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CompareTooltip runs={runs} isDark={isDark} />} />
                <Legend
                  formatter={(id) => runs.find((r) => r.scenario.id === id)?.scenario.name ?? id}
                  wrapperStyle={{ fontSize: 12 }}
                />
                {runs.map((run) => (
                  <Line
                    key={run.scenario.id}
                    type="monotone"
                    dataKey={run.scenario.id}
                    stroke={run.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Compare table */}
          <div className="overflow-x-auto -mx-2 px-2 mt-4 custom-scrollbar">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="text-xs nw-text-muted text-right">
                  <th className="text-left font-medium py-2 pr-3">Scenario</th>
                  <th className="font-medium py-2 px-2">Ending NW</th>
                  <th className="font-medium py-2 px-2">Multiple</th>
                  <th className="font-medium py-2 pl-2">CAGR</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const { result, scenario, color } = run
                  const mult = result.startNetWorth > 0 ? result.endingNetWorth / result.startNetWorth : null
                  const cagr =
                    result.startNetWorth > 0 && horizonYears > 0
                      ? (Math.pow(result.endingNetWorth / result.startNetWorth, 1 / horizonYears) - 1) * 100
                      : null
                  return (
                    <tr key={scenario.id} className="border-t nw-hairline text-right tabnums">
                      <td className="text-left py-2 pr-3">
                        <span className="inline-flex items-center gap-2 nw-text-primary font-medium">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          {scenario.name}
                        </span>
                      </td>
                      <td className="py-2 px-2 nw-text-primary font-semibold">{formatCompactINR(result.endingNetWorth)}</td>
                      <td className="py-2 px-2 nw-text-secondary">{mult ? `${mult.toFixed(1)}×` : '—'}</td>
                      <td className={`py-2 pl-2 ${(cagr ?? 0) >= 0 ? 'nw-gain' : 'nw-loss'}`}>{formatSignedPercent(cagr)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function CompareTooltip({ active, payload, label, runs, isDark }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        background: isDark ? '#1e2430' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
      }}
    >
      <p className="text-xs mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</p>
      {payload.map((p: any) => {
        const name = runs.find((r: any) => r.scenario.id === p.dataKey)?.scenario.name ?? p.dataKey
        return (
          <p key={p.dataKey} className="tabnums flex items-center gap-2" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>{name}</span>
            <span className="ml-auto font-semibold" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
              {formatCompactINR(p.value)}
            </span>
          </p>
        )
      })}
    </div>
  )
}
