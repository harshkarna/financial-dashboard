'use client'

import { ReactNode } from 'react'
import { TrendingUp, Target, PiggyBank, LineChart, Wallet, ArrowUpRight } from 'lucide-react'
import { formatCompactINR, formatINR, formatSignedCompactINR } from '@/lib/format'
import { ForecastResult } from '@/lib/forecast/types'
import { formatDuration } from '@/lib/netWorth'

interface ForecastKpisProps {
  result: ForecastResult
  horizonLabel: string
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  title,
  tone = 'neutral',
}: {
  icon: ReactNode
  label: string
  value: string
  sub?: string
  title?: string
  tone?: 'neutral' | 'gain' | 'loss'
}) {
  const valueColor =
    tone === 'gain' ? 'nw-gain' : tone === 'loss' ? 'nw-loss' : 'nw-text-primary'
  return (
    <div className="nw-card p-4" title={title}>
      <div className="flex items-center gap-2 mb-2">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
          {icon}
        </span>
        <span className="text-xs font-medium nw-text-secondary">{label}</span>
      </div>
      <p className={`text-xl font-bold tabnums ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs nw-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export function ForecastKpis({ result, horizonLabel }: ForecastKpisProps) {
  const increase = result.endingNetWorth - result.startNetWorth
  const multiple = result.startNetWorth > 0 ? result.endingNetWorth / result.startNetWorth : null
  const netGrowth = result.totalReturns - result.totalDepreciation

  // First milestone reached within the horizon that we weren't already past.
  const nextMilestone = result.milestones.find((m) => m.achieved && m.value > result.startNetWorth)

  const avgSurplus =
    result.monthly.length > 0
      ? result.monthly.reduce((s, p) => s + p.investibleSurplus, 0) / result.monthly.length
      : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <KpiCard
        icon={<TrendingUp className="w-4 h-4" />}
        label={`Projected net worth · ${horizonLabel}`}
        value={formatCompactINR(result.endingNetWorth)}
        sub={multiple ? `${multiple.toFixed(1)}× today` : undefined}
        title={formatINR(result.endingNetWorth)}
        tone="neutral"
      />
      <KpiCard
        icon={<ArrowUpRight className="w-4 h-4" />}
        label="Increase from today"
        value={formatSignedCompactINR(increase)}
        sub={`from ${formatCompactINR(result.startNetWorth)}`}
        title={formatINR(increase)}
        tone={increase >= 0 ? 'gain' : 'loss'}
      />
      <KpiCard
        icon={<Target className="w-4 h-4" />}
        label="Next milestone"
        value={nextMilestone ? nextMilestone.label : '—'}
        sub={
          nextMilestone && nextMilestone.date
            ? `${nextMilestone.date} · ${formatDuration(nextMilestone.monthsAway ?? 0)} away`
            : 'Not reached in this horizon'
        }
      />
      <KpiCard
        icon={<PiggyBank className="w-4 h-4" />}
        label="Total contributions"
        value={formatCompactINR(result.totalContributions)}
        sub="new money invested + saved"
        title={formatINR(result.totalContributions)}
      />
      <KpiCard
        icon={<LineChart className="w-4 h-4" />}
        label="Est. market growth"
        value={formatCompactINR(netGrowth)}
        sub="returns net of depreciation"
        title={formatINR(netGrowth)}
        tone={netGrowth >= 0 ? 'gain' : 'loss'}
      />
      <KpiCard
        icon={<Wallet className="w-4 h-4" />}
        label="Avg monthly surplus"
        value={formatCompactINR(avgSurplus)}
        sub="after tax & expenses"
        title={formatINR(avgSurplus)}
        tone={avgSurplus >= 0 ? 'gain' : 'loss'}
      />
    </div>
  )
}
