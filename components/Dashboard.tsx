'use client'

import { useEffect, useMemo, useState } from 'react'
import { Session } from 'next-auth'
import { AlertCircle, RefreshCw, LineChart, ArrowRight } from 'lucide-react'
import { MonthSelector } from './MonthSelector'
import { NetWorthHero } from './networth/NetWorthHero'
import { NetWorthChart } from './networth/NetWorthChart'
import { AssetsLiabilities } from './networth/AssetsLiabilities'
import { NetWorthInsights } from './networth/NetWorthInsights'
import { InvestmentGains } from './networth/InvestmentGains'
import { CompositionTrend } from './networth/CompositionTrend'
import { MilestoneToast } from './networth/MilestoneToast'
import { RangeKey } from './networth/range'
import { PrivacyProvider } from '@/contexts/PrivacyContext'
import { ComparisonResponse, MonthData, computeGains, toHistory } from '@/lib/netWorth'

interface DashboardProps {
  session: Session
  onSignOut: () => void
  onNavigateToForecast?: () => void
}

export function Dashboard({ session, onNavigateToForecast }: DashboardProps) {
  const [payload, setPayload] = useState<ComparisonResponse | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [range, setRange] = useState<RangeKey>('6M')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/comparison')
      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Your Google session expired. Sign out and sign in again to reload the sheet.'
            : 'Could not load your net worth data. Please try again.',
        )
        return
      }
      const data: ComparisonResponse = await res.json()
      if (!data.months || data.months.length === 0) {
        setError('No net worth data found. Add dated month columns to the "Net Worth" sheet.')
        return
      }
      setPayload(data)
      setSelectedMonth((prev) => (prev && data.months.some((m) => m.month === prev) ? prev : data.months[0].month))
    } catch (err) {
      console.error('Error fetching net worth data:', err)
      setError('Failed to load data. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const months = useMemo(() => payload?.months.map((m) => m.month) ?? [], [payload])
  const history = useMemo(() => (payload ? toHistory(payload.months) : []), [payload])
  const selectedIdx = useMemo(
    () => payload?.months.findIndex((m) => m.month === selectedMonth) ?? -1,
    [payload, selectedMonth],
  )
  const selected: MonthData | undefined = useMemo(
    () => (selectedIdx >= 0 ? payload?.months[selectedIdx] : payload?.months[0]),
    [payload, selectedIdx],
  )
  // Older month sits at the next higher index (list is most-recent-first).
  const prevAssets = useMemo(() => {
    if (!payload) return null
    const idx = selectedIdx >= 0 ? selectedIdx : 0
    return payload.months[idx + 1]?.assets ?? null
  }, [payload, selectedIdx])
  const netWorth = selected?.netWorth ?? 0
  const gains = useMemo(
    () => (selected ? computeGains(selected.assets, selected.costBasis) : null),
    [selected],
  )

  if (loading) return <DashboardSkeleton />

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
            onClick={load}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <PrivacyProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold nw-text-primary tracking-tight">Net Worth</h1>
                {onNavigateToForecast && (
                  <button
                    onClick={onNavigateToForecast}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                    title="Project your future net worth"
                  >
                    <LineChart className="w-4 h-4" />
                    Forecast
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
              <p className="text-sm nw-text-secondary mt-1">Your complete financial position, month by month.</p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              <MonthSelector months={months} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
            </div>
          </div>

          {/* Hero + Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 nw-rise">
              <NetWorthHero netWorth={netWorth} selectedMonth={selectedMonth} history={history} range={range} />
            </div>
            <div className="lg:col-span-3 nw-rise" style={{ animationDelay: '60ms' }}>
              <NetWorthChart
                history={history}
                range={range}
                onRangeChange={setRange}
                selectedMonth={selectedMonth}
                onRetry={load}
              />
            </div>
          </div>

          {/* Insights */}
          <div className="nw-rise" style={{ animationDelay: '120ms' }}>
            <NetWorthInsights
              history={history}
              mom={payload?.comparisons.mom ?? null}
              assets={selected?.assets ?? []}
              netWorth={netWorth}
            />
          </div>

          {/* Investment returns + composition trend */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 nw-rise" style={{ animationDelay: '160ms' }}>
              {gains && <InvestmentGains gains={gains} />}
            </div>
            <div className="lg:col-span-3 nw-rise" style={{ animationDelay: '200ms' }}>
              {payload && <CompositionTrend months={payload.months} range={range} selectedMonth={selectedMonth} />}
            </div>
          </div>

          {/* Assets & Liabilities */}
          <div className="nw-rise" style={{ animationDelay: '240ms' }}>
            <AssetsLiabilities
              assets={selected?.assets ?? []}
              liabilities={selected?.liabilities ?? []}
              prevAssets={prevAssets}
              netWorth={netWorth}
            />
          </div>
        </div>

        <MilestoneToast netWorth={netWorth} />
      </div>
    </PrivacyProvider>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        <div className="h-9 w-48 rounded-lg bg-slate-200/80 dark:bg-white/[0.08] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 h-56 rounded-2xl bg-slate-200/80 dark:bg-white/[0.08] animate-pulse" />
          <div className="lg:col-span-3 h-56 rounded-2xl bg-slate-200/80 dark:bg-white/[0.08] animate-pulse" />
        </div>
        <div className="h-28 rounded-2xl bg-slate-200/80 dark:bg-white/[0.08] animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-200/80 dark:bg-white/[0.08] animate-pulse" />
      </div>
    </div>
  )
}
