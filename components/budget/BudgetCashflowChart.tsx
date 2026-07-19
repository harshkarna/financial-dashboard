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
import { Activity } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatAxisINR, formatCompactINR } from '@/lib/format'
import { IncomeItem, cashflowTrend, monthLabel } from '@/lib/budget'

interface BudgetCashflowChartProps {
  income: IncomeItem[]
  showYear: boolean
}

const INCOME = '#6366f1'
const EXPENSE = '#f43f5e'
const SAVINGS = '#14b8a6'

export function BudgetCashflowChart({ income, showYear }: BudgetCashflowChartProps) {
  const { theme } = useTheme()
  const { hidden } = usePrivacy()
  const isDark = theme === 'dark'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'

  const data = useMemo(
    () => cashflowTrend(income).map((p) => ({ ...p, label: monthLabel(p.month, showYear) })),
    [income, showYear],
  )

  return (
    <section className="nw-card p-5 h-full" aria-label="Income, expenses and savings over time">
      <div className="flex items-center gap-2.5 mb-4">
        <Activity className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Cashflow</h2>
          <p className="text-xs nw-text-muted">Income, expenses &amp; savings month to month</p>
        </div>
      </div>

      {data.length < 2 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <Activity className="h-8 w-8 nw-text-muted" />
          <p className="text-sm nw-text-secondary">Not enough months to plot a trend yet</p>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="budgetExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EXPENSE} stopOpacity={isDark ? 0.26 : 0.18} />
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
                <Tooltip content={<CashTooltip isDark={isDark} hidden={hidden} />} />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke={EXPENSE}
                  strokeWidth={1.5}
                  fill="url(#budgetExpense)"
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
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke={SAVINGS}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 4, stroke: isDark ? '#0b0e14' : '#ffffff', strokeWidth: 2, fill: SAVINGS }}
                  animationDuration={500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              { c: INCOME, l: 'Income' },
              { c: EXPENSE, l: 'Expenses' },
              { c: SAVINGS, l: 'Savings' },
            ].map((x) => (
              <span key={x.l} className="inline-flex items-center gap-1.5 text-xs nw-text-secondary">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: x.c }} />
                {x.l}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function CashTooltip({ active, payload, label, isDark, hidden }: any) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]?.payload ?? {}
  const rows = [
    { name: 'Income', value: row.income ?? 0, color: INCOME },
    { name: 'Expenses', value: row.expenses ?? 0, color: EXPENSE },
    { name: 'Savings', value: row.savings ?? 0, color: SAVINGS },
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
          <span>{hidden ? '••••' : formatCompactINR(r.value, 1)}</span>
        </p>
      ))}
      {typeof row.savingsRate === 'number' && (
        <p
          className="tabnums mt-1 pt-1 border-t flex items-center justify-between gap-3"
          style={{ borderColor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)', color: isDark ? '#94a3b8' : '#64748b' }}
        >
          <span className="font-medium">Save rate</span>
          <span className="font-semibold">{row.savingsRate.toFixed(0)}%</span>
        </p>
      )}
    </div>
  )
}
