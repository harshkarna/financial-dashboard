'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import { PrivacyProvider, usePrivacy } from '@/contexts/PrivacyContext'
import { formatINR } from '@/lib/format'
import {
  BudgetResponse,
  ExpenseItem,
  IncomeItem,
  compareMonths,
  monthLabel,
  totalsFromIncome,
} from '@/lib/budget'
import { BudgetCategoryChart } from './budget/BudgetCategoryChart'
import { BudgetCategoryTrend } from './budget/BudgetCategoryTrend'
import { BudgetCashflowChart } from './budget/BudgetCashflowChart'
import { BudgetInsights } from './budget/BudgetInsights'
import { BudgetTopItems } from './budget/BudgetTopItems'

export function MonthlyBudget() {
  return (
    <PrivacyProvider>
      <BudgetInner />
    </PrivacyProvider>
  )
}

function BudgetInner() {
  const { hidden, toggle, mask } = usePrivacy()
  const [data, setData] = useState<BudgetResponse | null>(null)
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine available years + a sensible default once.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/budget')
        if (!res.ok) throw new Error(errFor(res.status))
        const d: BudgetResponse = await res.json()
        if (cancelled) return
        const ys = d.availableYears || []
        setYears(ys)
        const cur = new Date().getFullYear()
        setSelectedYear(ys.includes(cur) ? cur : ys[0] ?? null)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load budget data')
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch scoped data whenever the year changes.
  useEffect(() => {
    if (selectedYear === undefined) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const url = selectedYear == null ? '/api/budget' : `/api/budget?year=${selectedYear}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(errFor(res.status))
        const d: BudgetResponse = await res.json()
        if (cancelled) return
        setData(d)
        if (d.availableYears?.length) setYears(d.availableYears)
        setSelectedMonth(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load budget data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedYear])

  const allExpenses: ExpenseItem[] = useMemo(() => data?.expenses ?? [], [data])
  const allIncome: IncomeItem[] = useMemo(() => data?.income ?? [], [data])
  const showYear = selectedYear == null

  const months = useMemo(() => {
    const set = new Set<string>()
    for (const i of allIncome) set.add(i.month)
    for (const e of allExpenses) set.add(e.month)
    return Array.from(set).sort(compareMonths)
  }, [allIncome, allExpenses])

  const scopedExpenses = useMemo(
    () => (selectedMonth ? allExpenses.filter((e) => e.month === selectedMonth) : allExpenses),
    [allExpenses, selectedMonth],
  )
  const scopedIncome = useMemo(
    () => (selectedMonth ? allIncome.filter((i) => i.month === selectedMonth) : allIncome),
    [allIncome, selectedMonth],
  )

  const totals = useMemo(() => totalsFromIncome(scopedIncome), [scopedIncome])
  const money = (n: number) => mask(formatINR(n))

  if (loading) return <BudgetSkeleton />

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="nw-card flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="grid place-items-center w-14 h-14 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="w-7 h-7 nw-loss" />
          </div>
          <h3 className="text-lg font-semibold nw-text-primary mb-2">Something went wrong</h3>
          <p className="nw-text-secondary mb-6 max-w-md">{error}</p>
          <button
            onClick={() => setSelectedYear((y) => (y === undefined ? null : y))}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const scopeLabel = selectedMonth
    ? monthLabel(selectedMonth, true)
    : selectedYear
    ? `${selectedYear}`
    : 'All years'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold nw-text-primary tracking-tight">Budget</h1>
            <p className="text-sm nw-text-secondary mt-1">Where your money goes — {scopeLabel}.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5" role="tablist" aria-label="Year">
                <Pill active={selectedYear === null} onClick={() => setSelectedYear(null)}>
                  All
                </Pill>
                {years.map((year) => (
                  <Pill key={year} active={selectedYear === year} onClick={() => setSelectedYear(year)}>
                    {year}
                  </Pill>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={toggle}
              aria-pressed={hidden}
              aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
              title={hidden ? 'Show amounts' : 'Hide amounts'}
              className="shrink-0 rounded-lg p-2 nw-control border nw-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Month selector (within a single year) */}
        {!showYear && months.length > 1 && (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedMonth(null)}
                data-active={selectedMonth === null}
                className="nw-control flex-shrink-0 px-3 py-1.5 whitespace-nowrap border nw-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              >
                All months
              </button>
              {months.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  data-active={selectedMonth === m}
                  className="nw-control flex-shrink-0 px-3 py-1.5 whitespace-nowrap border nw-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  {monthLabel(m, false)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 nw-rise">
          <KpiCard icon={<Wallet className="h-4 w-4" />} iconTone="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" label="Income" value={money(totals.income)} />
          <KpiCard icon={<CreditCard className="h-4 w-4" />} iconTone="text-red-600 dark:text-red-400 bg-red-500/10" label="Expenses" value={money(totals.expenses)} />
          <KpiCard icon={<PiggyBank className="h-4 w-4" />} iconTone="text-teal-600 dark:text-teal-400 bg-teal-500/10" label="Savings" value={money(totals.savings)} />
          <KpiCard
            icon={totals.savingsRate >= 20 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            iconTone={totals.savingsRate >= 30 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'}
            label="Save rate"
            value={`${totals.savingsRate.toFixed(0)}%`}
            valueClass={totals.savingsRate >= 30 ? 'nw-gain' : undefined}
          />
        </div>

        {/* Insights */}
        <div className="nw-rise" style={{ animationDelay: '60ms' }}>
          <BudgetInsights expenses={scopedExpenses} income={scopedIncome} trendIncome={allIncome} />
        </div>

        {/* Cashflow + category mix */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 nw-rise" style={{ animationDelay: '120ms' }}>
            <BudgetCashflowChart income={allIncome} showYear={showYear} />
          </div>
          <div className="lg:col-span-2 nw-rise" style={{ animationDelay: '160ms' }}>
            <BudgetCategoryChart expenses={scopedExpenses} />
          </div>
        </div>

        {/* Category trend + top items */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 nw-rise" style={{ animationDelay: '200ms' }}>
            <BudgetCategoryTrend expenses={allExpenses} showYear={showYear} />
          </div>
          <div className="lg:col-span-2 nw-rise" style={{ animationDelay: '240ms' }}>
            <BudgetTopItems expenses={scopedExpenses} />
          </div>
        </div>
      </div>
    </div>
  )
}

function errFor(status: number): string {
  return status === 401
    ? 'Your Google session expired. Sign out and sign in again to reload the sheet.'
    : 'Could not load your budget data. Please try again.'
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      data-active={active}
      onClick={onClick}
      className="nw-control px-2.5 py-1 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
    >
      {children}
    </button>
  )
}

function KpiCard({
  icon,
  iconTone,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode
  iconTone: string
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="nw-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`grid place-items-center h-7 w-7 rounded-lg ${iconTone}`}>{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider nw-text-secondary truncate">{label}</span>
      </div>
      <p className={`tabnums text-xl sm:text-2xl font-bold truncate ${valueClass ?? 'nw-text-primary'}`} title={value}>
        {value}
      </p>
    </div>
  )
}

function BudgetSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        <div className="h-9 w-40 rounded-lg bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 h-72 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
