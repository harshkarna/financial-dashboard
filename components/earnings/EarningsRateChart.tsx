'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Percent } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { EarningRecord, chartLabel, sortChrono } from '@/lib/earnings'

interface EarningsRateChartProps {
  records: EarningRecord[]
  showYear: boolean
}

const SAVE = '#14b8a6'
const INVEST = '#6366f1'

export function EarningsRateChart({ records, showYear }: EarningsRateChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'
  const refColor = isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.35)'

  const data = useMemo(
    () =>
      sortChrono(records).map((r) => ({
        label: chartLabel(r, showYear),
        savingPercent: Math.max(0, Math.round(r.savingPercent * 10) / 10),
        investPercent: Math.max(0, Math.round(r.investPercent * 10) / 10),
      })),
    [records, showYear],
  )

  return (
    <section className="nw-card p-5 h-full" aria-label="Saving and investment rate over time">
      <div className="flex items-center gap-2.5 mb-4">
        <Percent className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Allocation Rate</h2>
          <p className="text-xs nw-text-muted">Share of income saved &amp; invested</p>
        </div>
      </div>

      {data.length < 2 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <Percent className="h-8 w-8 nw-text-muted" />
          <p className="text-sm nw-text-secondary">Not enough months to plot a trend yet</p>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickFormatter={(v: number) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  domain={[0, (dataMax: number) => Math.min(100, Math.ceil((dataMax + 10) / 10) * 10)]}
                />
                <ReferenceLine y={30} stroke={refColor} strokeDasharray="4 4" />
                <Tooltip content={<RateTooltip isDark={isDark} />} />
                <Line
                  type="monotone"
                  dataKey="savingPercent"
                  stroke={SAVE}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: isDark ? '#0b0e14' : '#ffffff', strokeWidth: 2, fill: SAVE }}
                  animationDuration={500}
                />
                <Line
                  type="monotone"
                  dataKey="investPercent"
                  stroke={INVEST}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: isDark ? '#0b0e14' : '#ffffff', strokeWidth: 2, fill: INVEST }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs nw-text-secondary">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SAVE }} />
              Saving %
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs nw-text-secondary">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INVEST }} />
              Invest %
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs nw-text-muted">
              <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: refColor }} />
              30% target
            </span>
          </div>
        </>
      )}
    </section>
  )
}

function RateTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload ?? {}
  const rows = [
    { name: 'Saving', value: row.savingPercent ?? 0, color: SAVE },
    { name: 'Invest', value: row.investPercent ?? 0, color: INVEST },
  ]
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{
        background: isDark ? '#1e2430' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
      }}
    >
      <p className="mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</p>
      {rows.map((r) => (
        <p key={r.name} className="tabnums flex items-center justify-between gap-3" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: r.color }} />
            {r.name}
          </span>
          <span>{r.value.toFixed(1)}%</span>
        </p>
      ))}
    </div>
  )
}
