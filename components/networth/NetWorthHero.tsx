'use client'

import { useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff, Target } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { usePrivacy } from '@/contexts/PrivacyContext'
import {
  formatINR,
  formatCompactINR,
  formatSignedCompactINR,
  formatSignedPercent,
} from '@/lib/format'
import {
  HistoryPoint,
  currentMilestone,
  nextMilestone,
  MILESTONES,
} from '@/lib/netWorth'
import { RangeKey, rangeLabel } from './range'

interface NetWorthHeroProps {
  netWorth: number
  selectedMonth: string
  history: HistoryPoint[]
  range: RangeKey
  lastUpdated?: string
}

export function NetWorthHero({ netWorth, selectedMonth, history, range, lastUpdated }: NetWorthHeroProps) {
  const { hidden, toggle, mask } = usePrivacy()
  const animated = useCountUp(netWorth)

  const periodChange = useMemo(() => {
    if (history.length < 2) return null
    const idx = history.findIndex((h) => h.month === selectedMonth)
    const endIdx = idx === -1 ? history.length - 1 : idx
    const lookback = range === 'ALL' ? endIdx : range === '3M' ? 3 : range === '6M' ? 6 : 12
    const startIdx = Math.max(0, endIdx - lookback)
    if (startIdx === endIdx) return null
    const start = history[startIdx].netWorth
    const end = history[endIdx].netWorth
    const change = end - start
    const percent = start !== 0 ? (change / start) * 100 : null
    return { change, percent, fromMonth: history[startIdx].month }
  }, [history, selectedMonth, range])

  const isNegative = netWorth < 0
  const gained = (periodChange?.change ?? 0) >= 0

  // Milestone progress (real milestones only; hidden past the top one)
  const cur = currentMilestone(netWorth)
  const next = nextMilestone(netWorth)
  const prevValue = cur?.value ?? 0
  const nextValue = next?.value ?? MILESTONES[MILESTONES.length - 1].value
  const progress = next ? ((netWorth - prevValue) / (nextValue - prevValue)) * 100 : 100
  const toNext = next ? nextValue - netWorth : 0

  const heroDisplay = hidden
    ? mask(formatINR(netWorth))
    : formatINR(Math.round(animated))

  return (
    <section className="nw-card p-5 sm:p-6" aria-label="Net worth summary">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider nw-text-secondary">Total Net Worth</p>

          <div className="mt-1.5 flex items-baseline gap-3 flex-wrap">
            <h1
              className={`tabnums text-4xl sm:text-5xl font-bold tracking-tight ${
                isNegative ? 'nw-loss' : 'nw-text-primary'
              }`}
              aria-live="polite"
            >
              {isNegative && !hidden ? '-' : ''}
              {hidden ? heroDisplay : formatINR(Math.abs(Math.round(animated)))}
            </h1>
          </div>

          {/* Period change */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {periodChange ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                  gained
                    ? 'bg-emerald-500/10 nw-gain'
                    : 'bg-red-500/10 nw-loss'
                }`}
              >
                {gained ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {hidden ? mask(formatSignedCompactINR(periodChange.change)) : formatSignedCompactINR(periodChange.change)}
                <span className="opacity-70">·</span>
                {formatSignedPercent(periodChange.percent)}
              </span>
            ) : (
              <span className="text-sm nw-text-muted">Not enough history for a {rangeLabel(range)} change</span>
            )}
            <span className="text-sm nw-text-secondary">over {rangeLabel(range).toLowerCase()}</span>
          </div>

          <p className="mt-2 text-xs nw-text-muted">
            As of {selectedMonth}
            {lastUpdated ? ` · updated ${lastUpdated}` : ''}
          </p>
        </div>

        {/* Privacy toggle */}
        <button
          type="button"
          onClick={toggle}
          aria-pressed={hidden}
          aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
          title={hidden ? 'Show amounts' : 'Hide amounts'}
          className="shrink-0 rounded-lg p-2 nw-control focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
          {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Milestone progress */}
      {next && (
        <div className="mt-5 pt-4 border-t nw-hairline">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 nw-text-secondary">
              <Target className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              Next milestone: <span className="nw-text-primary font-medium">{next.label}</span>
            </span>
            <span className="tabnums font-semibold text-indigo-600 dark:text-indigo-400">
              {Math.round(Math.max(0, Math.min(progress, 100)))}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs nw-text-muted">
            {hidden ? mask(formatCompactINR(toNext)) : formatCompactINR(toNext)} to go
          </p>
        </div>
      )}
    </section>
  )
}
