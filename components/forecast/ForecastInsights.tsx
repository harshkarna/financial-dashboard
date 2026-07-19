'use client'

import { useMemo } from 'react'
import { Lightbulb, TrendingUp, PiggyBank, AlertTriangle, Target } from 'lucide-react'
import { formatCompactINR } from '@/lib/format'
import { formatDuration } from '@/lib/netWorth'
import { ASSET_CLASS_LABELS, AssetClassId, ForecastResult } from '@/lib/forecast/types'

interface ForecastInsightsProps {
  result: ForecastResult
  horizonLabel: string
}

type Tone = 'neutral' | 'gain' | 'loss'
interface Insight {
  icon: React.ComponentType<{ className?: string }>
  tone: Tone
  text: string
}

export function ForecastInsights({ result, horizonLabel }: ForecastInsightsProps) {
  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = []
    const gain = result.endingNetWorth - result.startNetWorth
    const marketNet = result.totalReturns - result.totalDepreciation

    // 1. Saving vs. market split.
    if (gain > 0) {
      const marketShare = Math.round((marketNet / gain) * 100)
      const contribShare = 100 - marketShare
      out.push({
        icon: TrendingUp,
        tone: 'neutral',
        text: `Over ${horizonLabel}, about ${Math.max(0, marketShare)}% of your ${formatCompactINR(gain)} increase comes from market growth and ${Math.max(0, contribShare)}% from money you add.`,
      })
    }

    // 2. Next milestone.
    const nextMilestone = result.milestones.find((m) => m.achieved && m.value > result.startNetWorth)
    if (nextMilestone?.date && nextMilestone.monthsAway) {
      out.push({
        icon: Target,
        tone: 'neutral',
        text: `You cross ${nextMilestone.label} around ${nextMilestone.date} (${formatDuration(nextMilestone.monthsAway)} away).`,
      })
    }

    // 4. Average savings.
    const avgSurplus =
      result.monthly.length > 0
        ? result.monthly.reduce((s, p) => s + p.investibleSurplus, 0) / result.monthly.length
        : 0
    if (avgSurplus !== 0) {
      out.push({
        icon: PiggyBank,
        tone: avgSurplus > 0 ? 'gain' : 'loss',
        text:
          avgSurplus > 0
            ? `You invest about ${formatCompactINR(avgSurplus)} a month on average after tax and expenses.`
            : `On average you spend ${formatCompactINR(-avgSurplus)} more than you earn each month — you're drawing down savings.`,
      })
    }

    // 5. First deficit month (expenses overtaking income).
    const deficit = result.monthly.find((p) => p.investibleSurplus < 0)
    if (deficit && avgSurplus > 0) {
      out.push({
        icon: AlertTriangle,
        tone: 'loss',
        text: `Watch ${deficit.date}: projected expenses and taxes exceed income that month.`,
      })
    }

    // 6. Ending composition — largest asset.
    const last = result.monthly[result.monthly.length - 1]
    if (last) {
      let topId: AssetClassId | null = null
      let topVal = 0
      for (const [id, val] of Object.entries(last.valueByAsset) as [AssetClassId, number][]) {
        if (val > topVal) {
          topVal = val
          topId = id
        }
      }
      if (topId && last.totalAssets > 0) {
        const share = Math.round((topVal / last.totalAssets) * 100)
        out.push({
          icon: TrendingUp,
          tone: 'neutral',
          text: `By ${last.date}, ${ASSET_CLASS_LABELS[topId]} is your largest holding at ${share}% of assets (${formatCompactINR(topVal)}).`,
        })
      }
    }

    return out
  }, [result, horizonLabel])

  if (insights.length === 0) return null

  return (
    <section className="nw-card p-5" aria-label="Insights">
      <div className="flex items-center gap-2.5 mb-4">
        <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
        <h2 className="text-base font-semibold nw-text-primary">What This Means</h2>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon
          const color =
            ins.tone === 'gain'
              ? 'text-emerald-500 dark:text-emerald-400'
              : ins.tone === 'loss'
                ? 'nw-loss'
                : 'text-indigo-500 dark:text-indigo-400'
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span className={`grid place-items-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </span>
              <p className="text-sm nw-text-secondary leading-snug">{ins.text}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
