'use client'

import { useMemo, useState } from 'react'
import { Crown, Flame, CalendarRange, Gauge, ArrowUp, ArrowDown } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatCompactINR, formatSignedCompactINR } from '@/lib/format'
import {
  ExpenseItem,
  IncomeItem,
  categoryTotals,
  categoryMovers,
  biggestExpenses,
  totalsFromIncome,
  avgMonthlyExpenditure,
  monthLabel,
} from '@/lib/budget'

interface BudgetInsightsProps {
  expenses: ExpenseItem[]
  income: IncomeItem[]
  /** Full (unscoped) monthly income series used for the rolling average. */
  trendIncome: IncomeItem[]
}

export function BudgetInsights({ expenses, income, trendIncome }: BudgetInsightsProps) {
  const { mask } = usePrivacy()
  const [avgPeriod, setAvgPeriod] = useState<3 | 6 | 12>(6)
  const avgExp = useMemo(() => avgMonthlyExpenditure(trendIncome, avgPeriod), [trendIncome, avgPeriod])

  const stats = useMemo(() => {
    const cats = categoryTotals(expenses)
    const totals = totalsFromIncome(income)
    const distinctMonths = new Set(expenses.map((e) => e.month)).size || 1
    const totalSpent = cats.reduce((s, c) => s + c.amount, 0)
    const biggest = biggestExpenses(expenses, 1)[0] ?? null
    const { latestMonth, priorMonth, movers } = categoryMovers(expenses)
    const increases = movers.filter((m) => m.change > 0).slice(0, 4)
    const decreases = movers.filter((m) => m.change < 0).slice(0, 4)
    return {
      topCategory: cats[0] ?? null,
      biggest,
      avgMonthly: totalSpent / distinctMonths,
      distinctMonths,
      savingsRate: totals.savingsRate,
      savings: totals.savings,
      transactions: expenses.length,
      latestMonth,
      priorMonth,
      increases,
      decreases,
      hasMovers: movers.length > 0 && priorMonth != null,
    }
  }, [expenses, income])

  if (expenses.length === 0) {
    return (
      <section className="nw-card p-5" aria-label="Spending insights">
        <h2 className="text-base font-semibold nw-text-primary mb-3">Insights</h2>
        <p className="text-sm nw-text-secondary">No expenses recorded in this period.</p>
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <section className="nw-card p-5" aria-label="Spending insights">
        <h2 className="text-base font-semibold nw-text-primary mb-4">Insights</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile
            icon={<Crown className="h-4 w-4" />}
            iconTone="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
            label="Top category"
            value={stats.topCategory?.category ?? '—'}
            sub={
              stats.topCategory
                ? `${mask(formatCompactINR(stats.topCategory.amount, 1))} · ${stats.topCategory.percent.toFixed(0)}%`
                : undefined
            }
          />
          <Tile
            icon={<Flame className="h-4 w-4" />}
            iconTone="text-red-600 dark:text-red-400 bg-red-500/10"
            label="Biggest expense"
            value={stats.biggest ? mask(formatCompactINR(stats.biggest.amount, 1)) : '—'}
            sub={stats.biggest ? `${stats.biggest.breakdown} · ${stats.biggest.month}` : undefined}
          />
          <Tile
            icon={<CalendarRange className="h-4 w-4" />}
            iconTone="text-sky-600 dark:text-sky-400 bg-sky-500/10"
            label="Avg expenses / mo"
            value={avgExp.count > 0 ? mask(formatCompactINR(avgExp.avg, 1)) : '—'}
            sub={avgExp.count > 0 ? `over last ${avgExp.count} month${avgExp.count > 1 ? 's' : ''}` : 'no expense data'}
            footer={
              <div className="mt-1.5 flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5 w-max">
                {[3, 6, 12].map((p) => (
                  <button
                    key={p}
                    onClick={() => setAvgPeriod(p as 3 | 6 | 12)}
                    data-active={avgPeriod === p}
                    className="nw-control px-2 py-0.5 text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                  >
                    {p === 12 ? '1Y' : `${p}M`}
                  </button>
                ))}
              </div>
            }
          />
          <Tile
            icon={<Gauge className="h-4 w-4" />}
            iconTone={
              stats.savingsRate >= 30
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
            }
            label="Save rate"
            value={`${stats.savingsRate.toFixed(0)}%`}
            valueClass={stats.savingsRate >= 30 ? 'nw-gain' : 'nw-text-primary'}
            sub={`${mask(formatCompactINR(stats.savings, 1))} saved`}
          />
        </div>
      </section>

      {/* Month-over-month category movers */}
      {stats.hasMovers && (
        <section className="nw-card p-5" aria-label="Month over month movers">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold nw-text-primary">What Changed</h2>
            <span className="text-xs nw-text-muted">
              {monthLabel(stats.latestMonth!, true)} vs {monthLabel(stats.priorMonth!, true)}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <MoverColumn title="Spent more" tone="loss" movers={stats.increases} mask={mask} />
            <MoverColumn title="Spent less" tone="gain" movers={stats.decreases} mask={mask} />
          </div>
        </section>
      )}
    </div>
  )
}

function Tile({
  icon,
  iconTone,
  label,
  value,
  valueClass,
  sub,
  footer,
}: {
  icon: React.ReactNode
  iconTone: string
  label: string
  value: string
  valueClass?: string
  sub?: string
  footer?: React.ReactNode
}) {
  return (
    <div className="nw-inset p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`grid place-items-center h-6 w-6 rounded-md ${iconTone}`}>{icon}</span>
        <span className="text-[11px] nw-text-secondary truncate">{label}</span>
      </div>
      <p className={`text-sm font-semibold truncate ${valueClass ?? 'nw-text-primary'}`} title={value}>
        {value}
      </p>
      {sub && <p className="text-[11px] nw-text-muted truncate mt-0.5">{sub}</p>}
      {footer}
    </div>
  )
}

function MoverColumn({
  title,
  tone,
  movers,
  mask,
}: {
  title: string
  tone: 'gain' | 'loss'
  movers: { category: string; change: number; percent: number | null }[]
  mask: (s: string) => string
}) {
  const color = tone === 'loss' ? 'nw-loss' : 'nw-gain'
  const Icon = tone === 'loss' ? ArrowUp : ArrowDown
  return (
    <div>
      <p className="text-xs font-medium nw-text-secondary mb-2">{title}</p>
      {movers.length === 0 ? (
        <p className="text-xs nw-text-muted py-1">No change</p>
      ) : (
        <ul className="divide-y nw-hairline">
          {movers.map((m) => (
            <li key={m.category} className="flex items-center justify-between gap-2 py-2">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                <span className="text-sm nw-text-primary truncate">{m.category}</span>
              </span>
              <span className={`tabnums text-sm font-medium shrink-0 ${color}`}>
                {mask(formatSignedCompactINR(m.change, 1))}
                {m.percent != null && (
                  <span className="nw-text-muted font-normal"> · {m.percent > 0 ? '+' : ''}{m.percent.toFixed(0)}%</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
