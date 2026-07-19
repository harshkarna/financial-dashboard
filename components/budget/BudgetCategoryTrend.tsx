'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Layers } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatAxisINR, formatCompactINR } from '@/lib/format'
import { ExpenseItem, categoryOverTime, colorForIndex, monthLabel } from '@/lib/budget'

interface BudgetCategoryTrendProps {
  expenses: ExpenseItem[]
  showYear: boolean
}

export function BudgetCategoryTrend({ expenses, showYear }: BudgetCategoryTrendProps) {
  const { theme } = useTheme()
  const { hidden } = usePrivacy()
  const isDark = theme === 'dark'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'

  const { rows, categories } = useMemo(() => categoryOverTime(expenses, 6), [expenses])
  const data = useMemo(
    () => rows.map((r) => ({ ...r, label: monthLabel(String(r.month), showYear) })),
    [rows, showYear],
  )

  const colorFor = (cat: string, i: number) => (cat === 'Other' ? '#94a3b8' : colorForIndex(i))

  return (
    <section className="nw-card p-5 h-full" aria-label="Spending by category over time">
      <div className="flex items-center gap-2.5 mb-4">
        <Layers className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Category Trend</h2>
          <p className="text-xs nw-text-muted">How your spending mix shifts month to month</p>
        </div>
      </div>

      {data.length < 2 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <Layers className="h-8 w-8 nw-text-muted" />
          <p className="text-sm nw-text-secondary">Not enough months to plot a trend yet</p>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
                <Tooltip content={<TrendTooltip isDark={isDark} hidden={hidden} categories={categories} colorFor={colorFor} />} />
                {categories.map((c, i) => (
                  <Area
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stackId="1"
                    stroke={colorFor(c, i)}
                    fill={colorFor(c, i)}
                    fillOpacity={isDark ? 0.5 : 0.35}
                    strokeWidth={1}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {categories.map((c, i) => (
              <span key={c} className="inline-flex items-center gap-1.5 text-xs nw-text-secondary">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorFor(c, i) }} />
                {c}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function TrendTooltip({ active, payload, label, isDark, hidden, categories, colorFor }: any) {
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
        const idx = categories.indexOf(p.dataKey)
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
      <p
        className="tabnums mt-1 pt-1 border-t flex items-center justify-between gap-3"
        style={{ borderColor: isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)', color: isDark ? '#e6eaf0' : '#0f172a' }}
      >
        <span className="font-medium">Total</span>
        <span className="font-semibold">{hidden ? '••••' : formatCompactINR(total, 1)}</span>
      </p>
    </div>
  )
}
