'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart as LineChartIcon, AlertCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatAxisINR, formatINR, formatSignedCompactINR } from '@/lib/format'
import { HistoryPoint } from '@/lib/netWorth'
import { RANGES, RangeKey } from './range'

interface NetWorthChartProps {
  history: HistoryPoint[]
  range: RangeKey
  onRangeChange: (r: RangeKey) => void
  selectedMonth: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

interface Point {
  month: string
  netWorth: number
  prev: number | null
}

export function NetWorthChart({
  history,
  range,
  onRangeChange,
  selectedMonth,
  loading,
  error,
  onRetry,
}: NetWorthChartProps) {
  const { theme } = useTheme()
  const { hidden } = usePrivacy()
  const isDark = theme === 'dark'

  const accent = '#6366f1'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'
  const prevColor = isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.5)'

  const { data, showPrev } = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range)!
    const endIdx = (() => {
      const i = history.findIndex((h) => h.month === selectedMonth)
      return i === -1 ? history.length - 1 : i
    })()
    const windowLen = cfg.months === null ? endIdx + 1 : Math.min(cfg.months + 1, endIdx + 1)
    const startIdx = Math.max(0, endIdx - (windowLen - 1))

    const points: Point[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      const prevIdx = i - windowLen
      points.push({
        month: history[i].month,
        netWorth: history[i].netWorth,
        prev: prevIdx >= 0 ? history[prevIdx].netWorth : null,
      })
    }
    const showPrev = cfg.months !== null && points.some((p) => p.prev !== null)
    return { data: points, showPrev }
  }, [history, range, selectedMonth])

  const summary = useMemo(() => {
    if (data.length === 0) return ''
    const first = data[0]
    const last = data[data.length - 1]
    return `Net worth from ${formatINR(first.netWorth)} in ${first.month} to ${formatINR(
      last.netWorth,
    )} in ${last.month}.`
  }, [data])

  const RangeControls = (
    <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5" role="tablist" aria-label="Time range">
      {RANGES.map((r) => (
        <button
          key={r.key}
          role="tab"
          aria-selected={r.key === range}
          data-active={r.key === range}
          onClick={() => onRangeChange(r.key)}
          className="nw-control px-2.5 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
          {r.label}
        </button>
      ))}
    </div>
  )

  return (
    <section className="nw-card p-5" aria-label="Net worth trend">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <LineChartIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h2 className="text-base font-semibold nw-text-primary">Net Worth Trend</h2>
            <p className="text-xs nw-text-muted">
              {showPrev ? 'Solid: this period · dashed: previous period' : 'Monthly progression'}
            </p>
          </div>
        </div>
        {RangeControls}
      </div>

      {loading ? (
        <div className="h-64 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 nw-loss" />
          <p className="text-sm nw-text-secondary">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="nw-control px-3 py-1.5" data-active="true">
              Try again
            </button>
          )}
        </div>
      ) : data.length < 2 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
          <LineChartIcon className="h-8 w-8 nw-text-muted" />
          <p className="text-sm nw-text-secondary">Not enough history to plot a trend yet</p>
          <p className="text-xs nw-text-muted">Add a few more months of data to see the chart.</p>
        </div>
      ) : (
        <div className="h-64" role="img" aria-label={summary}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="nwArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={isDark ? 0.28 : 0.18} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: axisColor }}
                tickFormatter={(v: string) => v.split(' ')[0]}
                axisLine={false}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                tickFormatter={(v: number) => (hidden ? '•••' : formatAxisINR(v))}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<ChartTooltip isDark={isDark} hidden={hidden} showPrev={showPrev} />}
                cursor={{ stroke: accent, strokeOpacity: 0.25, strokeWidth: 1 }}
              />
              {showPrev && (
                <Area
                  type="monotone"
                  dataKey="prev"
                  stroke={prevColor}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              )}
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke={accent}
                strokeWidth={2}
                fill="url(#nwArea)"
                dot={false}
                activeDot={{ r: 4, stroke: isDark ? '#0b0e14' : '#ffffff', strokeWidth: 2, fill: accent }}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  isDark,
  hidden,
  showPrev,
}: any) {
  if (!active || !payload || !payload.length) return null
  const current = payload.find((p: any) => p.dataKey === 'netWorth')?.value ?? 0
  const prev = payload.find((p: any) => p.dataKey === 'prev')?.value
  const delta = typeof prev === 'number' ? current - prev : null

  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        background: isDark ? '#1e2430' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
      }}
    >
      <p className="text-xs mb-0.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        {label}
      </p>
      <p className="tabnums font-semibold" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
        {hidden ? '••••••' : formatINR(current)}
      </p>
      {showPrev && delta !== null && (
        <p className="tabnums text-xs mt-0.5" style={{ color: delta >= 0 ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#f87171' : '#dc2626') }}>
          {hidden ? '••••' : `${formatSignedCompactINR(delta)} vs prev period`}
        </p>
      )}
    </div>
  )
}
