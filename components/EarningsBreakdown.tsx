'use client'

import { useEffect, useMemo, useState } from 'react'
import { Session } from 'next-auth'
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Rocket,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import { PrivacyProvider, usePrivacy } from '@/contexts/PrivacyContext'
import { formatINR, formatCompactINR } from '@/lib/format'
import { EarningRecord, sortChrono } from '@/lib/earnings'
import { EarningsInsights } from './earnings/EarningsInsights'
import { EarningsTrendChart } from './earnings/EarningsTrendChart'
import { EarningsRateChart } from './earnings/EarningsRateChart'

interface EarningsData {
  earnings: EarningRecord[]
  availableYears: number[]
  totalRecords: number
}

interface EarningsBreakdownProps {
  session: Session
  onSignOut: () => void
}

export function EarningsBreakdown(props: EarningsBreakdownProps) {
  return (
    <PrivacyProvider>
      <EarningsInner {...props} />
    </PrivacyProvider>
  )
}

function EarningsInner(_props: EarningsBreakdownProps) {
  const { hidden, toggle, mask } = usePrivacy()
  const [data, setData] = useState<EarningsData | null>(null)
  const [allData, setAllData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear())
  const [showTable, setShowTable] = useState(true)

  const fetchEarningsData = async (year: number | null) => {
    try {
      setLoading(true)
      setError(null)

      const allResponse = await fetch('/api/earnings')
      if (allResponse.ok) setAllData(await allResponse.json())

      const url = year ? `/api/earnings?year=${year}` : '/api/earnings'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Your Google session expired. Sign out and sign in again to reload the sheet.'
            : 'Could not load your earnings data. Please try again.',
        )
      }
      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEarningsData(selectedYear)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  const money = (amount: number) => mask(formatINR(amount))
  const compact = (amount: number) => mask(formatCompactINR(amount, 1))

  const yearData = useMemo(() => sortChrono(data?.earnings ?? []), [data])
  const showYear = selectedYear == null

  const totals = useMemo(() => {
    const income = yearData.reduce((s, r) => s + r.income, 0)
    const expenditure = yearData.reduce((s, r) => s + r.expenditure, 0)
    const saving = yearData.reduce((s, r) => s + r.saving, 0)
    const invest = yearData.reduce((s, r) => s + r.invest, 0)
    return {
      income,
      expenditure,
      saving,
      invest,
      savingPct: income > 0 ? (saving / income) * 100 : 0,
      investPct: income > 0 ? (invest / income) * 100 : 0,
    }
  }, [yearData])

  if (loading) return <EarningsSkeleton />

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
            onClick={() => fetchEarningsData(selectedYear)}
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

  const years = data.availableYears

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold nw-text-primary tracking-tight">Earnings</h1>
            <p className="text-sm nw-text-secondary mt-1">
              Where your income goes, month by month.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Year pills */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              <div
                className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5"
                role="tablist"
                aria-label="Year"
              >
                <button
                  role="tab"
                  aria-selected={selectedYear === null}
                  data-active={selectedYear === null}
                  onClick={() => setSelectedYear(null)}
                  className="nw-control px-2.5 py-1 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  All
                </button>
                {years.map((year) => (
                  <button
                    key={year}
                    role="tab"
                    aria-selected={selectedYear === year}
                    data-active={selectedYear === year}
                    onClick={() => setSelectedYear(year)}
                    className="nw-control px-2.5 py-1 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy toggle */}
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

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 nw-rise">
          <KpiCard
            icon={<Wallet className="h-4 w-4" />}
            iconTone="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
            label="Total income"
            value={money(totals.income)}
          />
          <KpiCard
            icon={<CreditCard className="h-4 w-4" />}
            iconTone="text-red-600 dark:text-red-400 bg-red-500/10"
            label="Expenditure"
            value={money(totals.expenditure)}
            sub={totals.income > 0 ? `${(100 - totals.savingPct).toFixed(0)}% of income` : undefined}
          />
          <KpiCard
            icon={<PiggyBank className="h-4 w-4" />}
            iconTone="text-teal-600 dark:text-teal-400 bg-teal-500/10"
            label="Total saving"
            value={money(totals.saving)}
            sub={`${totals.savingPct.toFixed(1)}% of income`}
          />
          <KpiCard
            icon={<Rocket className="h-4 w-4" />}
            iconTone="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
            label="Invested"
            value={money(totals.invest)}
            sub={`${totals.investPct.toFixed(1)}% of income`}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 nw-rise" style={{ animationDelay: '60ms' }}>
            <EarningsTrendChart records={yearData} showYear={showYear} />
          </div>
          <div className="lg:col-span-2 nw-rise" style={{ animationDelay: '120ms' }}>
            <EarningsRateChart records={yearData} showYear={showYear} />
          </div>
        </div>

        {/* Insights */}
        <div className="nw-rise" style={{ animationDelay: '160ms' }}>
          <EarningsInsights data={yearData} selectedYear={selectedYear} allData={allData?.earnings || []} />
        </div>

        {/* Monthly table */}
        <div className="nw-card overflow-hidden nw-rise" style={{ animationDelay: '200ms' }}>
          <button
            onClick={() => setShowTable((s) => !s)}
            className="w-full flex items-center justify-between px-5 py-4 border-b nw-hairline hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <h2 className="text-base font-semibold nw-text-primary">
                Monthly Breakdown {selectedYear ? `· ${selectedYear}` : '· All years'}
              </h2>
            </div>
            {showTable ? (
              <ChevronUp className="w-4 h-4 nw-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 nw-text-muted" />
            )}
          </button>

          {showTable && (
            <div className="overflow-x-auto">
              {/* Mobile cards */}
              <div className="md:hidden divide-y nw-hairline">
                {yearData.map((record, index) => (
                  <div key={index} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold nw-text-primary">{record.month}</span>
                      <SavingBadge percent={record.savingPercent} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <MiniStat label="Income" value={compact(record.income)} />
                      <MiniStat label="Expenses" value={compact(record.expenditure)} />
                      <MiniStat label="Saving" value={compact(record.saving)} />
                      <MiniStat label="Invested" value={compact(record.invest)} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <table className="hidden md:table min-w-full">
                <thead>
                  <tr className="border-b nw-hairline">
                    {['Month', 'Income', 'Expenditure', 'Saving', 'Invested', 'Saving %', 'Invest %'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-[11px] font-semibold nw-text-muted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y nw-hairline">
                  {yearData.map((record, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium nw-text-primary">{record.month}</td>
                      <td className="px-6 py-3 whitespace-nowrap tabnums text-sm nw-text-primary">{money(record.income)}</td>
                      <td className="px-6 py-3 whitespace-nowrap tabnums text-sm nw-text-secondary">{money(record.expenditure)}</td>
                      <td className="px-6 py-3 whitespace-nowrap tabnums text-sm nw-text-primary">{money(record.saving)}</td>
                      <td className="px-6 py-3 whitespace-nowrap tabnums text-sm nw-text-primary">{money(record.invest)}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <SavingBadge percent={record.savingPercent} />
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <InvestBadge percent={record.investPercent} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  iconTone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  iconTone: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="nw-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`grid place-items-center h-7 w-7 rounded-lg ${iconTone}`}>{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider nw-text-secondary truncate">{label}</span>
      </div>
      <p className="tabnums text-xl sm:text-2xl font-bold nw-text-primary truncate" title={value}>
        {value}
      </p>
      {sub && <p className="text-xs nw-text-muted mt-1">{sub}</p>}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="nw-inset p-2">
      <span className="text-[11px] nw-text-muted">{label}</span>
      <p className="tabnums font-semibold nw-text-primary">{value}</p>
    </div>
  )
}

function SavingBadge({ percent }: { percent: number }) {
  const tone =
    percent > 30
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
      : percent > 15
      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
      : 'text-red-600 dark:text-red-400 bg-red-500/10'
  return (
    <span className={`inline-flex tabnums px-2.5 py-1 text-xs font-semibold rounded-full ${tone}`}>
      {percent.toFixed(0)}%
    </span>
  )
}

function InvestBadge({ percent }: { percent: number }) {
  const tone =
    percent > 50
      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
      : percent > 25
      ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10'
      : 'nw-text-secondary bg-slate-100 dark:bg-white/5'
  return (
    <span className={`inline-flex tabnums px-2.5 py-1 text-xs font-semibold rounded-full ${tone}`}>
      {percent.toFixed(0)}%
    </span>
  )
}

function EarningsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        <div className="h-9 w-40 rounded-lg bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 h-72 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}
