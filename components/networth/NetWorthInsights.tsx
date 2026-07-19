'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Flame, Crown, ArrowUp, ArrowDown, CalendarRange, Gauge, PieChart, Briefcase } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatCompactINR, formatSignedCompactINR, formatSignedPercent } from '@/lib/format'
import {
  AssetRow,
  HistoryPoint,
  PeriodComparison,
  equityCompensation,
  equityExposure,
  growthStreak,
  highestEver,
  latestMonthlyChange,
  trailingGrowth,
} from '@/lib/netWorth'

interface NetWorthInsightsProps {
  history: HistoryPoint[]
  mom: PeriodComparison | null
  assets: AssetRow[]
  netWorth: number
}

interface Insight {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'gain' | 'loss' | 'neutral'
}

export function NetWorthInsights({ history, mom, assets, netWorth }: NetWorthInsightsProps) {
  const { mask } = usePrivacy()

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = []

    const monthly = latestMonthlyChange(history)
    if (monthly) {
      const gain = monthly.change >= 0
      out.push({
        icon: gain ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
        label: 'This month',
        value: mask(formatSignedCompactINR(monthly.change)),
        sub: formatSignedPercent(monthly.percent),
        tone: gain ? 'gain' : 'loss',
      })
    }

    const streak = growthStreak(history)
    if (streak >= 2) {
      out.push({
        icon: <Flame className="h-4 w-4" />,
        label: 'Growth streak',
        value: `${streak} months`,
        sub: 'rising in a row',
        tone: 'gain',
      })
    }

    const peak = highestEver(history)
    if (peak) {
      out.push({
        icon: <Crown className="h-4 w-4" />,
        label: peak.isCurrent ? 'All-time high' : 'Highest ever',
        value: mask(formatCompactINR(peak.value)),
        sub: peak.isCurrent ? 'this month' : peak.month,
        tone: 'neutral',
      })
    }

    const trailing = trailingGrowth(history, 12)
    if (trailing) {
      const gain = trailing.change >= 0
      out.push({
        icon: <CalendarRange className="h-4 w-4" />,
        label: trailing.months >= 12 ? 'Last 12 months' : `Last ${trailing.months} months`,
        value: mask(formatSignedCompactINR(trailing.change)),
        sub: formatSignedPercent(trailing.percent),
        tone: gain ? 'gain' : 'loss',
      })
      out.push({
        icon: <Gauge className="h-4 w-4" />,
        label: 'Avg / month',
        value: mask(formatSignedCompactINR(trailing.avgPerMonth)),
        sub: `over ${trailing.months} months`,
        tone: trailing.avgPerMonth >= 0 ? 'gain' : 'loss',
      })
    }

    const equity = equityExposure(assets, netWorth)
    if (equity.amount > 0) {
      out.push({
        icon: <PieChart className="h-4 w-4" />,
        label: 'Equity exposure',
        value: `${equity.percent.toFixed(0)}%`,
        sub: mask(formatCompactINR(equity.amount, 1)),
        tone: 'neutral',
      })
    }

    const comp = equityCompensation(assets)
    if (comp.amount > 0) {
      out.push({
        icon: <Briefcase className="h-4 w-4" />,
        label: 'Equity comp (vested)',
        value: mask(formatCompactINR(comp.amount, 1)),
        sub: `${comp.items.length} grant${comp.items.length > 1 ? 's' : ''}`,
        tone: 'neutral',
      })
    }

    if (mom?.topGainers?.length) {
      const g = mom.topGainers[0]
      out.push({
        icon: <ArrowUp className="h-4 w-4" />,
        label: 'Top contributor',
        value: g.item,
        sub: mask(formatSignedCompactINR(g.change)),
        tone: 'gain',
      })
    }

    if (mom?.topLosers?.length) {
      const l = mom.topLosers[0]
      out.push({
        icon: <ArrowDown className="h-4 w-4" />,
        label: 'Largest decline',
        value: l.item,
        sub: mask(formatSignedCompactINR(l.change)),
        tone: 'loss',
      })
    }

    return out
  }, [history, mom, assets, netWorth, mask])

  if (insights.length === 0) return null

  return (
    <section className="nw-card p-5" aria-label="Financial insights">
      <h2 className="text-base font-semibold nw-text-primary mb-4">Insights</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {insights.map((ins, i) => {
          const toneClass = ins.tone === 'gain' ? 'nw-gain' : ins.tone === 'loss' ? 'nw-loss' : 'nw-text-primary'
          const iconTone =
            ins.tone === 'gain'
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : ins.tone === 'loss'
              ? 'text-red-600 dark:text-red-400 bg-red-500/10'
              : 'nw-text-secondary bg-slate-100 dark:bg-white/5'
          return (
            <div key={i} className="nw-inset p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`grid place-items-center h-6 w-6 rounded-md ${iconTone}`}>{ins.icon}</span>
                <span className="text-[11px] nw-text-secondary truncate">{ins.label}</span>
              </div>
              <p className={`tabnums text-sm font-semibold truncate ${toneClass}`} title={ins.value}>
                {ins.value}
              </p>
              {ins.sub && <p className="text-[11px] nw-text-muted truncate mt-0.5">{ins.sub}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
