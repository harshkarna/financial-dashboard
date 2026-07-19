'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatCompactINR } from '@/lib/format'
import { ExpenseItem, categoryTotals, colorForIndex } from '@/lib/budget'

interface BudgetCategoryChartProps {
  expenses: ExpenseItem[]
}

export function BudgetCategoryChart({ expenses }: BudgetCategoryChartProps) {
  const { mask } = usePrivacy()
  const cats = useMemo(() => categoryTotals(expenses), [expenses])
  const total = useMemo(() => cats.reduce((s, c) => s + c.amount, 0), [cats])

  // Keep chart legible: top 7 slices + Other.
  const donutData = useMemo(() => {
    const top = cats.slice(0, 7)
    const rest = cats.slice(7)
    const restAmount = rest.reduce((s, c) => s + c.amount, 0)
    const rows = top.map((c, i) => ({ name: c.category, amount: c.amount, color: colorForIndex(i) }))
    if (restAmount > 0) rows.push({ name: 'Other', amount: restAmount, color: '#94a3b8' })
    return rows
  }, [cats])

  return (
    <section className="nw-card p-5 h-full" aria-label="Spending by category">
      <div className="flex items-center gap-2.5 mb-4">
        <PieIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Where It Goes</h2>
          <p className="text-xs nw-text-muted">Spending by category</p>
        </div>
      </div>

      {cats.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <PieIcon className="h-8 w-8 nw-text-muted" />
          <p className="text-sm nw-text-secondary">No categorised expenses in this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                  dataKey="amount"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] nw-text-muted">Total</span>
              <span className="tabnums text-lg font-bold nw-text-primary">{mask(formatCompactINR(total, 1))}</span>
            </div>
          </div>

          <ul className="space-y-2">
            {cats.slice(0, 6).map((c, i) => (
              <li key={c.category}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: colorForIndex(i) }} />
                    <span className="nw-text-secondary truncate">{c.category}</span>
                  </span>
                  <span className="tabnums nw-text-primary font-medium shrink-0">{mask(formatCompactINR(c.amount, 1))}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(c.percent, 100)}%`, backgroundColor: colorForIndex(i) }}
                  />
                </div>
                <div className="mt-0.5 text-[11px] nw-text-muted">{c.percent.toFixed(0)}% · {c.count} items</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
