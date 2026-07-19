'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  Award,
  Clock,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import { PrivacyProvider, usePrivacy } from '@/contexts/PrivacyContext'
import { formatINR, formatCompactINR, formatSignedPercent } from '@/lib/format'
import { OtherIncomeData, formatUSD, computeCoursePace } from '@/lib/otherIncome'
import {
  CumulativeEarningsChart,
  EarningsTimelineChart,
  FYEarningsChart,
} from './otherincome/OtherIncomeCharts'
import {
  PublishingMomentum,
  TaxSummaryCard,
  CoursePaceCard,
  PendingPipeline,
  TopCourses,
  EntriesTable,
} from './otherincome/OtherIncomeWidgets'
import { Reveal } from './motion/Reveal'

export function OtherIncomeAnalytics() {
  return (
    <PrivacyProvider>
      <OtherIncomeInner />
    </PrivacyProvider>
  )
}

function OtherIncomeInner() {
  const { hidden, toggle, mask } = usePrivacy()
  const [data, setData] = useState<OtherIncomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/other-income')
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? 'Your Google session expired. Sign out and sign in again to reload the sheet.'
            : 'Could not load your other income data. Please try again.',
        )
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load other income data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <OtherIncomeSkeleton />

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="nw-card flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="grid place-items-center w-14 h-14 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="w-7 h-7 nw-loss" />
          </div>
          <h3 className="text-lg font-semibold nw-text-primary mb-2">Something went wrong</h3>
          <p className="nw-text-secondary mb-6 max-w-md">{error || 'No data available'}</p>
          <button onClick={load} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { summary, taxes, categories, fyBreakdown, fyComparison, topCourses, courseInsights, entries, monthlyTrend } = data
  const money = (n: number) => mask(formatINR(n))
  const pace = computeCoursePace(categories.courses.entries)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold nw-text-primary tracking-tight">Other Income</h1>
            <p className="text-sm nw-text-secondary mt-1">Courses, royalties &amp; side income — after tax.</p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={hidden}
            aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
            title={hidden ? 'Show amounts' : 'Hide amounts'}
            className="shrink-0 self-start sm:self-auto rounded-lg p-2 nw-control border nw-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Hero + cumulative */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 nw-rise">
            <section className="nw-card p-5 sm:p-6 h-full flex flex-col" aria-label="Earnings summary">
              <p className="text-xs font-medium uppercase tracking-wider nw-text-secondary">Lifetime post-tax income</p>
              <h2 className="tabnums text-4xl sm:text-5xl font-bold tracking-tight nw-text-primary mt-1.5">
                {mask(formatINR(summary.totalEarningsINRPostTax))}
              </h2>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {fyComparison.previousFYData && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                      fyComparison.yoyGrowth >= 0 ? 'bg-emerald-500/10 nw-gain' : 'bg-red-500/10 nw-loss'
                    }`}
                  >
                    {fyComparison.yoyGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {formatSignedPercent(fyComparison.yoyGrowth)}
                  </span>
                )}
                <span className="text-sm nw-text-secondary">YoY · FY {fyComparison.currentFY}</span>
              </div>

              <div className="mt-5 pt-4 border-t nw-hairline grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] nw-text-muted uppercase tracking-wide">Gross received</p>
                  <p className="tabnums text-lg font-semibold nw-text-primary mt-0.5">{money(summary.totalEarningsINR)}</p>
                  <p className="tabnums text-xs nw-text-secondary mt-0.5">{mask(formatUSD(summary.totalEarningsUSD))}</p>
                </div>
                <div>
                  <p className="text-[11px] nw-text-muted uppercase tracking-wide">Avg rate</p>
                  <p className="tabnums text-lg font-semibold nw-text-primary mt-0.5">
                    ₹{summary.avgConversionRate ? summary.avgConversionRate.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs nw-text-secondary mt-0.5">per USD</p>
                </div>
              </div>
            </section>
          </div>
          <div className="lg:col-span-3 nw-rise" style={{ animationDelay: '60ms' }}>
            <CumulativeEarningsChart monthlyTrend={monthlyTrend} />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 nw-rise" style={{ animationDelay: '100ms' }}>
          <Kpi icon={<BookOpen className="h-4 w-4" />} tone="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" label="Courses" value={String(summary.totalCourses)} sub={`${summary.paidCourses} paid`} />
          <Kpi icon={<Award className="h-4 w-4" />} tone="text-violet-600 dark:text-violet-400 bg-violet-500/10" label="Avg / course" value={money(summary.avgCourseEarningPostTax)} sub="post-tax" />
          <Kpi icon={<Clock className="h-4 w-4" />} tone="text-amber-600 dark:text-amber-400 bg-amber-500/10" label="Pending" value={money(summary.pendingPayments)} sub={`${summary.pendingCount} invoice${summary.pendingCount !== 1 ? 's' : ''}`} valueClass={summary.pendingPayments > 0 ? 'nw-text-primary' : undefined} />
          <Kpi icon={<Receipt className="h-4 w-4" />} tone="text-sky-600 dark:text-sky-400 bg-sky-500/10" label="Effective tax" value={`${taxes.effectiveTaxRate.toFixed(1)}%`} sub={`${mask(formatCompactINR(taxes.totalTaxLiability, 1))} liability`} />
        </div>

        {/* Timeline + momentum */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <Reveal className="lg:col-span-3">
            <EarningsTimelineChart monthlyTrend={monthlyTrend} />
          </Reveal>
          <Reveal className="lg:col-span-2" delay={0.06}>
            <PublishingMomentum insights={courseInsights} />
          </Reveal>
        </div>

        {/* Course pace + FY bars */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <Reveal className="lg:col-span-2">
            <CoursePaceCard pace={pace} />
          </Reveal>
          <Reveal className="lg:col-span-3" delay={0.06}>
            <FYEarningsChart fyBreakdown={fyBreakdown} />
          </Reveal>
        </div>

        {/* Top courses + pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <Reveal className="lg:col-span-3">
            <TopCourses courses={topCourses} />
          </Reveal>
          <Reveal className="lg:col-span-2" delay={0.06}>
            <PendingPipeline entries={entries} />
          </Reveal>
        </div>

        {/* Tax tracker — full width */}
        <Reveal>
          <TaxSummaryCard
            liability={taxes.totalTaxLiability}
            paid={taxes.totalTaxesPaid}
            due={taxes.totalTaxesDue}
            effectiveRate={taxes.effectiveTaxRate}
            byFY={taxes.byFY}
          />
        </Reveal>

        {/* Entries table */}
        <Reveal>
          <EntriesTable entries={entries} />
        </Reveal>
      </div>
    </div>
  )
}

function Kpi({
  icon,
  tone,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: React.ReactNode
  tone: string
  label: string
  value: string
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="nw-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`grid place-items-center h-7 w-7 rounded-lg ${tone}`}>{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider nw-text-secondary truncate">{label}</span>
      </div>
      <p className={`tabnums text-xl sm:text-2xl font-bold truncate ${valueClass ?? 'nw-text-primary'}`} title={value}>{value}</p>
      {sub && <p className="text-xs nw-text-muted mt-1">{sub}</p>}
    </div>
  )
}

function OtherIncomeSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        <div className="h-9 w-48 rounded-lg bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 h-56 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          <div className="lg:col-span-3 h-56 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}
