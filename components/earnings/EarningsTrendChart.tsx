'use client'

import { useMemo } from 'react'
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowLeftRight } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatAxisINR, formatCompactINR } from '@/lib/format'
import { EarningRecord, chartLabel, sortChrono } from '@/lib/earnings'

interface EarningsTrendChartProps {
  records: EarningRecord[]
  /** When true, x labels include the year (e.g. "Aug '21"). */
  showYear: boolean
}

const INCOME = '#6366f1'
const EXPENSE = '#f43f5e'

export function EarningsTrendChart({ records, showYear }: EarningsTrendChartProps) {
  const { theme } = useTheme()
  const { hidden } = usePrivacy()
  const isDark = theme === 'dark'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'

  const data = useMemo(
    () =>
      sortChrono(records).map((r) => ({
        label: chartLabel(r, showYear),
        income: r.income,
        expenditure: r.expenditure,
        saved: r.income - r.expenditure,
      })),
    [records, showYear],
  )

  return (
    <section className="nw-card p-5 h-full" aria-label="Income versus expenses over time">
      <div className="flex items-center gap-2.5 mb-4">
        <ArrowLeftRight className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Income vs Expenses</h2>
          <p className="text-xs nw-text-muted">The gap above spending is what you kept</p>
        </div>
      </div>

      {data.length < 2 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <ArrowLeftRight className="h-8 w-8 nw-text-muted" />
          <p className="text-sm nw-text-secondary">Not enough months to plot a trend yet</p>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="earnExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EXPENSE} stopOpacity={isDark ? 0.28 : 0.2} />
                    <stop offset="100%" stopColor={EXPENSE} stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  tickFormatter={(v: number) => (hidden ? '•••' : formatAxisINR(v))}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<TrendTooltip isDark={isDark} hidden={hidden} />} />
                <Area
                  type="monotone"
                  dataKey="expenditure"
                  stroke={EXPENSE}
                  strokeWidth={1.5}
                  fill="url(#earnExpense)"
                  dot={false}
                  activeDot={{ r: 3, stroke: isDark ? '#0b0e14' : '#ffffff', strokeWidth: 2, fill: EXPENSE }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke={INCOME}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: isDark ? '#0b0e14' : '#ffffff', strokeWidth: 2, fill: INCOME }}
                  animationDuration={500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs nw-text-secondary">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INCOME }} />
              Income
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs nw-text-secondary">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: EXPENSE }} />
              Expenses
            </span>
          </div>
        </>
      )}
    </section>
  )
}

function TrendTooltip({ active, payload, label, isDark, hidden }: any) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload ?? {}
  const rows: { name: string; value: number; color: string }[] = [
    { name: 'Income', value: row.income ?? 0, color: INCOME },
    { name: 'Expenses', value: row.expenditure ?? 0, color: EXPENSE },
  ]
  const saved = row.saved ?? 0
  const savedColor = saved >= 0 ? (isDark ? '#22c55e' : '#16a34a') : isDark ? '#f87171' : '#dc2626'
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
          <span>{hidden ? '••••' : formatCompactINR(r.value, 1)}</span>
        </p>
      ))}
      <p
        className="tabnums mt-1 pt-1 border-t flex items-center justify-between gap-3"
        style={{
          borderColor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)',
          color: savedColor,
        }}
      >
        <span className="font-medium" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Saved</span>
        <span className="font-semibold">{hidden ? '••••' : formatCompactINR(saved, 1)}</span>
      </p>
    </div>
  )
}
