'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Activity,
  PiggyBank,
  Rocket,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatCompactINR } from '@/lib/format'
import {
  EarningRecord,
  MONTH_ORDER,
  monthIndex,
  maxMonthIndexForYear,
  sortChrono,
} from '@/lib/earnings'

interface EarningsInsightsProps {
  data: EarningRecord[]
  selectedYear: number | null
  allData: EarningRecord[]
}

export function EarningsInsights({ data, selectedYear, allData }: EarningsInsightsProps) {
  const { theme } = useTheme()
  const { mask } = usePrivacy()
  const isDark = theme === 'dark'

  const [savingPeriod, setSavingPeriod] = useState<3 | 6 | 12>(3)
  const [investmentPeriod, setInvestmentPeriod] = useState<3 | 6 | 12>(6)
  const [yoyMode, setYoyMode] = useState<'ytd' | 'full-year'>('ytd')
  const [yoyChartMetrics, setYoyChartMetrics] = useState<
    'income-saving' | 'income-saving-invest' | 'four-way'
  >('income-saving')
  const [compareWithYear, setCompareWithYear] = useState<number | null>(null)

  const fmt = (amount: number) => mask(formatCompactINR(amount, 1))
  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  const insights = useMemo(() => {
    if (!data || data.length === 0) return null

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const completeData = sortChrono(data).filter((record) => {
      if (record.year < currentYear) return true
      if (record.year === currentYear) return monthIndex(record.monthName) <= currentMonth
      return false
    })

    const filteredData = completeData.filter((record) => record.income > 1000)
    if (filteredData.length === 0) return null

    const last6Months = filteredData.slice(-6)
    const last3Months = filteredData.slice(-3)

    let incomeGrowth = 0
    if (last6Months.length >= 6) {
      const firstPeriod = last6Months.slice(0, 3)
      const secondPeriod = last6Months.slice(3, 6)
      const firstIncome = firstPeriod.reduce((s, r) => s + r.income, 0)
      const secondIncome = secondPeriod.reduce((s, r) => s + r.income, 0)
      incomeGrowth = firstIncome > 0 ? ((secondIncome - firstIncome) / firstIncome) * 100 : 0
    }

    const bestMonth = filteredData.reduce(
      (best, cur) => (cur.income - cur.expenditure > best.income - best.expenditure ? cur : best),
      filteredData[0],
    )
    const worstMonth = filteredData.reduce(
      (worst, cur) => (cur.income - cur.expenditure < worst.income - worst.expenditure ? cur : worst),
      filteredData[0],
    )

    const avgSavingPercent =
      filteredData.reduce((s, r) => s + r.savingPercent, 0) / filteredData.length
    const avgInvestPercent =
      filteredData.reduce((s, r) => s + r.investPercent, 0) / filteredData.length

    const consistentSavers = filteredData.filter((r) => r.savingPercent > avgSavingPercent * 1.1).length
    const consistentInvestors = filteredData.filter(
      (r) => r.investPercent > avgInvestPercent * 1.1,
    ).length

    const avgSavingScore = Math.min((avgSavingPercent / 30) * 40, 40)
    const avgInvestScore = Math.min((avgInvestPercent / 50) * 40, 40)
    const consistencyScore =
      ((consistentSavers + consistentInvestors) / (filteredData.length * 2)) * 20
    const healthScore = avgSavingScore + avgInvestScore + consistencyScore

    const recentAvgSaving =
      last3Months.length > 0
        ? last3Months.reduce((s, r) => s + r.savingPercent, 0) / last3Months.length
        : 0
    const recentAvgInvest =
      last3Months.length > 0
        ? last3Months.reduce((s, r) => s + r.investPercent, 0) / last3Months.length
        : 0

    const recentSavingAmount = filteredData.slice(-savingPeriod).reduce((s, r) => s + r.saving, 0)
    const recentInvestAmount = filteredData
      .slice(-investmentPeriod)
      .reduce((s, r) => s + r.invest, 0)

    return {
      incomeGrowth,
      bestMonth,
      worstMonth,
      avgSavingPercent,
      avgInvestPercent,
      healthScore,
      consistentSavers,
      recentAvgSaving,
      recentAvgInvest,
      recentSavingAmount,
      recentInvestAmount,
      totalMonths: filteredData.length,
      incomeGrowthAvailable: last6Months.length >= 6,
    }
  }, [data, savingPeriod, investmentPeriod])

  const priorYearOptions = useMemo(() => {
    if (selectedYear == null) return [] as number[]
    return Array.from(new Set(allData.map((r) => r.year)))
      .filter((y) => y < selectedYear)
      .sort((a, b) => b - a)
  }, [allData, selectedYear])

  useEffect(() => {
    if (selectedYear == null) {
      setCompareWithYear(null)
      return
    }
    const opts = Array.from(new Set(allData.map((r) => r.year)))
      .filter((y) => y < selectedYear)
      .sort((a, b) => b - a)
    setCompareWithYear((prev) => (prev != null && opts.includes(prev) ? prev : opts[0] ?? null))
  }, [selectedYear, allData])

  const yoyAnalysis = useMemo(() => {
    if (selectedYear == null || compareWithYear == null) return null
    const y = selectedYear
    const p = compareWithYear
    const maxY = maxMonthIndexForYear(y, allData)
    const maxP = maxMonthIndexForYear(p, allData)
    if (maxY < 0 || maxP < 0) return null

    let endIdx: number | null = null
    if (yoyMode === 'ytd') {
      const cal = new Date()
      endIdx = y === cal.getFullYear() ? Math.min(cal.getMonth(), maxY, maxP) : Math.min(maxY, maxP)
      if (endIdx < 0) return null
    }

    const sumThrough = (year: number, end: number | null) => {
      const arr = allData.filter((r) => {
        if (r.year !== year) return false
        if (end == null) return true
        const mi = monthIndex(r.monthName)
        return mi >= 0 && mi <= end
      })
      return {
        income: arr.reduce((s, r) => s + r.income, 0),
        saving: arr.reduce((s, r) => s + r.saving, 0),
        invest: arr.reduce((s, r) => s + r.invest, 0),
        expenditure: arr.reduce((s, r) => s + r.expenditure, 0),
      }
    }

    const current = sumThrough(y, endIdx)
    const previous = sumThrough(p, endIdx)
    const periodLabel =
      yoyMode === 'full-year'
        ? `All logged months · ${y} vs ${p}`
        : `Same period (Jan–${MONTH_ORDER[endIdx!]}) · ${y} vs ${p}`
    const incomeChange =
      previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0
    const savingChange =
      previous.saving > 0 ? ((current.saving - previous.saving) / previous.saving) * 100 : 0

    return { current, previous, periodLabel, incomeChange, savingChange, y, p }
  }, [selectedYear, compareWithYear, allData, yoyMode])

  const yoyChartRows = useMemo(() => {
    if (!yoyAnalysis) return []
    const { current, previous } = yoyAnalysis
    const row = (name: string, key: 'income' | 'saving' | 'invest' | 'expenditure') => ({
      name,
      current: current[key],
      prior: previous[key],
    })
    switch (yoyChartMetrics) {
      case 'income-saving':
        return [row('Income', 'income'), row('Saving', 'saving')]
      case 'income-saving-invest':
        return [row('Income', 'income'), row('Saving', 'saving'), row('Investment', 'invest')]
      case 'four-way':
        return [
          row('Income', 'income'),
          row('Expenses', 'expenditure'),
          row('Saving', 'saving'),
          row('Investment', 'invest'),
        ]
      default:
        return []
    }
  }, [yoyAnalysis, yoyChartMetrics])

  if (!insights) {
    return (
      <section className="nw-card p-5" aria-label="Financial insights">
        <h2 className="text-base font-semibold nw-text-primary mb-3">Insights</h2>
        <div className="text-center py-8">
          <Activity className="h-8 w-8 nw-text-muted mx-auto mb-2" />
          <p className="text-sm nw-text-secondary">No complete data available yet</p>
          <p className="text-xs nw-text-muted mt-1">
            {selectedYear && selectedYear > new Date().getFullYear()
              ? `Data for ${selectedYear} will appear as months complete`
              : 'Add more earnings data to see insights'}
          </p>
        </div>
      </section>
    )
  }

  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'

  const healthTone =
    insights.healthScore >= 80 ? 'gain' : insights.healthScore >= 60 ? 'neutral' : 'loss'
  const growthGain = insights.incomeGrowth >= 0

  const Tile = ({
    icon,
    iconTone,
    label,
    value,
    valueClass,
    sub,
  }: {
    icon: React.ReactNode
    iconTone: string
    label: string
    value: string
    valueClass?: string
    sub?: string
  }) => (
    <div className="nw-inset p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`grid place-items-center h-6 w-6 rounded-md ${iconTone}`}>{icon}</span>
        <span className="text-[11px] nw-text-secondary truncate">{label}</span>
      </div>
      <p className={`tabnums text-lg font-semibold truncate ${valueClass ?? 'nw-text-primary'}`}>{value}</p>
      {sub && <p className="text-[11px] nw-text-muted truncate mt-0.5">{sub}</p>}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Insight tiles */}
      <section className="nw-card p-5" aria-label="Financial insights">
        <h2 className="text-base font-semibold nw-text-primary mb-4">Insights</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile
            icon={<Activity className="h-4 w-4" />}
            iconTone={
              healthTone === 'gain'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : healthTone === 'loss'
                ? 'text-red-600 dark:text-red-400 bg-red-500/10'
                : 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
            }
            label="Financial health"
            value={`${insights.healthScore.toFixed(0)} / 100`}
            sub={
              insights.healthScore >= 80
                ? 'Excellent habits'
                : insights.healthScore >= 60
                ? 'Good management'
                : 'Room to improve'
            }
          />
          <Tile
            icon={growthGain ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            iconTone={
              growthGain
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-red-600 dark:text-red-400 bg-red-500/10'
            }
            label="Income growth"
            value={insights.incomeGrowthAvailable ? `${growthGain ? '+' : ''}${formatPercent(insights.incomeGrowth)}` : 'N/A'}
            valueClass={
              !insights.incomeGrowthAvailable
                ? 'nw-text-muted'
                : growthGain
                ? 'nw-gain'
                : 'nw-loss'
            }
            sub={insights.incomeGrowthAvailable ? '3M vs previous 3M' : 'Need 6+ months'}
          />
          <Tile
            icon={<PiggyBank className="h-4 w-4" />}
            iconTone="text-teal-600 dark:text-teal-400 bg-teal-500/10"
            label="Recent saving"
            value={formatPercent(insights.recentAvgSaving)}
            sub="Last 3 months avg"
          />
          <Tile
            icon={<Rocket className="h-4 w-4" />}
            iconTone="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
            label="Recent investing"
            value={formatPercent(insights.recentAvgInvest)}
            sub="Last 3 months avg"
          />
        </div>
      </section>

      {/* Performance + YoY / Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Performance */}
        <section className="nw-card p-5" aria-label="Performance analysis">
          <div className="flex items-center gap-2.5 mb-4">
            <Award className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-base font-semibold nw-text-primary">Performance</h2>
          </div>

          <div className="divide-y nw-hairline">
            <Row
              label="Best month"
              primary={insights.bestMonth.month}
              sub={`+${fmt(insights.bestMonth.income - insights.bestMonth.expenditure)} surplus`}
              subClass="nw-gain"
            />
            <Row
              label="Challenging month"
              primary={insights.worstMonth.month}
              sub={`${fmt(insights.worstMonth.income - insights.worstMonth.expenditure)} surplus`}
              subClass={insights.worstMonth.income - insights.worstMonth.expenditure >= 0 ? 'nw-text-muted' : 'nw-loss'}
            />
            <Row
              label="Consistent saving"
              primary={`${insights.consistentSavers}/${insights.totalMonths}`}
              sub={`${((insights.consistentSavers / insights.totalMonths) * 100).toFixed(0)}% of months above avg`}
              subClass="nw-text-muted"
            />
            <RowWithToggle
              label="Recent saving"
              period={savingPeriod}
              onPeriod={(p) => setSavingPeriod(p)}
              primary={fmt(insights.recentSavingAmount)}
              sub={`Last ${savingPeriod === 12 ? '1 year' : `${savingPeriod} months`}`}
            />
            <RowWithToggle
              label="Recent investing"
              period={investmentPeriod}
              onPeriod={(p) => setInvestmentPeriod(p)}
              primary={fmt(insights.recentInvestAmount)}
              sub={`Last ${investmentPeriod === 12 ? '1 year' : `${investmentPeriod} months`}`}
            />
          </div>
        </section>

        {/* YoY or Goals */}
        <section className="nw-card p-5" aria-label={yoyAnalysis ? 'Year over year' : 'Financial goals'}>
          <div className="flex items-center gap-2.5 mb-4">
            <Target className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-base font-semibold nw-text-primary">
              {yoyAnalysis ? 'Year over Year' : 'Financial Goals'}
            </h2>
          </div>

          {yoyAnalysis ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-xs nw-text-secondary leading-relaxed">{yoyAnalysis.periodLabel}</p>
                <div className="flex flex-wrap gap-2">
                  <NwSelect
                    value={yoyMode}
                    onChange={(v) => setYoyMode(v as 'ytd' | 'full-year')}
                    options={[
                      { value: 'ytd', label: 'Same months' },
                      { value: 'full-year', label: 'All logged months' },
                    ]}
                  />
                  {priorYearOptions.length > 1 && (
                    <NwSelect
                      value={String(compareWithYear ?? '')}
                      onChange={(v) => setCompareWithYear(parseInt(v, 10))}
                      options={priorYearOptions.map((py) => ({ value: String(py), label: `vs ${py}` }))}
                    />
                  )}
                  <NwSelect
                    value={yoyChartMetrics}
                    onChange={(v) => setYoyChartMetrics(v as typeof yoyChartMetrics)}
                    options={[
                      { value: 'income-saving', label: 'Income & Saving' },
                      { value: 'income-saving-invest', label: '+ Investment' },
                      { value: 'four-way', label: 'All four' },
                    ]}
                  />
                </div>
              </div>

              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yoyChartRows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => mask(formatCompactINR(Number(v), 1))}
                      tick={{ fill: axisColor, fontSize: 11 }}
                      width={52}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)' }}
                      content={({ active, payload, label }: any) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div
                            className="rounded-xl px-3 py-2 text-xs shadow-lg"
                            style={{
                              background: isDark ? '#1e2430' : '#ffffff',
                              border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
                            }}
                          >
                            <p className="mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</p>
                            {payload.map((item: any) => (
                              <p
                                key={String(item.dataKey)}
                                className="tabnums flex items-center justify-between gap-3"
                                style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
                                  {String(item.name)}
                                </span>
                                <span>{mask(formatCompactINR(Number(item.value), 1))}</span>
                              </p>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      formatter={(value) => <span className="nw-text-secondary">{value}</span>}
                    />
                    <Bar dataKey="current" name={`${yoyAnalysis.y}`} fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="prior" name={`${yoyAnalysis.p}`} fill={isDark ? '#475569' : '#cbd5e1'} radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="nw-inset px-4 py-3">
                  <span className="text-[11px] nw-text-secondary uppercase tracking-wide">Income change</span>
                  <div className={`tabnums text-lg font-semibold mt-0.5 ${yoyAnalysis.incomeChange >= 0 ? 'nw-gain' : 'nw-loss'}`}>
                    {yoyAnalysis.incomeChange >= 0 ? '+' : ''}
                    {formatPercent(yoyAnalysis.incomeChange)}
                  </div>
                  <div className="text-[11px] nw-text-muted mt-0.5">vs {yoyAnalysis.p}</div>
                </div>
                <div className="nw-inset px-4 py-3">
                  <span className="text-[11px] nw-text-secondary uppercase tracking-wide">Saving change</span>
                  <div className={`tabnums text-lg font-semibold mt-0.5 ${yoyAnalysis.savingChange >= 0 ? 'nw-gain' : 'nw-loss'}`}>
                    {yoyAnalysis.savingChange >= 0 ? '+' : ''}
                    {formatPercent(yoyAnalysis.savingChange)}
                  </div>
                  <div className="text-[11px] nw-text-muted mt-0.5">vs {yoyAnalysis.p}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Goal
                label="Saving rate target"
                value={insights.avgSavingPercent}
                target={30}
                achievedText="Target achieved"
                pendingText="Keep improving"
              />
              <Goal
                label="Investment rate target"
                value={insights.avgInvestPercent}
                target={50}
                achievedText="Excellent"
                pendingText="Room to grow"
              />
              <div className="nw-inset p-4">
                <p className="text-sm nw-text-secondary">
                  <span className="font-semibold nw-text-primary">Tip: </span>
                  {insights.avgSavingPercent < 20
                    ? 'Focus on trimming expenses to lift your saving rate.'
                    : insights.avgInvestPercent < 30
                    ? 'Great saving habits — consider increasing your investment allocation.'
                    : "Excellent management — you're on track for strong wealth building."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Row({
  label,
  primary,
  sub,
  subClass,
}: {
  label: string
  primary: string
  sub: string
  subClass?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <span className="text-sm nw-text-secondary">{label}</span>
      <div className="text-right">
        <div className="text-sm font-semibold nw-text-primary">{primary}</div>
        <div className={`tabnums text-xs ${subClass ?? 'nw-text-muted'}`}>{sub}</div>
      </div>
    </div>
  )
}

function RowWithToggle({
  label,
  period,
  onPeriod,
  primary,
  sub,
}: {
  label: string
  period: 3 | 6 | 12
  onPeriod: (p: 3 | 6 | 12) => void
  primary: string
  sub: string
}) {
  return (
    <div className="flex items-center justify-between py-3 last:pb-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm nw-text-secondary truncate">{label}</span>
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5">
          {[3, 6, 12].map((p) => (
            <button
              key={p}
              onClick={() => onPeriod(p as 3 | 6 | 12)}
              data-active={period === p}
              className="nw-control px-2 py-0.5 text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              {p === 12 ? '1Y' : `${p}M`}
            </button>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="tabnums text-sm font-semibold nw-text-primary">{primary}</div>
        <div className="text-xs nw-text-muted">{sub}</div>
      </div>
    </div>
  )
}

function Goal({
  label,
  value,
  target,
  achievedText,
  pendingText,
}: {
  label: string
  value: number
  target: number
  achievedText: string
  pendingText: string
}) {
  const pct = Math.min((value / target) * 100, 100)
  const achieved = value >= target
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm nw-text-secondary">{label}</span>
        <div className="text-right">
          <span className={`tabnums text-sm font-semibold ${achieved ? 'nw-gain' : 'nw-text-primary'}`}>
            {value.toFixed(1)}% / {target}%
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] nw-text-muted">{achieved ? achievedText : pendingText}</p>
    </div>
  )
}

function NwSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="nw-control appearance-none pl-3 pr-8 py-1.5 text-xs cursor-pointer border nw-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.5rem center',
        backgroundSize: '1rem',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
