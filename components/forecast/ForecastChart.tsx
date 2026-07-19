'use client'

import { useMemo } from 'react'
import {
  Area,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { formatAxisINR, formatCompactINR, formatINR } from '@/lib/format'
import { HistoryPoint } from '@/lib/netWorth'
import { ForecastResult } from '@/lib/forecast/types'
import { FORECAST_MILESTONES } from '@/lib/forecast/engine'

interface ForecastChartProps {
  history: HistoryPoint[]
  result: ForecastResult
  scenarioName: string
}

interface Row {
  date: string
  actual: number | null
  forecast: number | null
  assets?: number
  liabilities?: number
  contributions?: number
  returns?: number
}

export function ForecastChart({ history, result, scenarioName }: ForecastChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const accent = '#6366f1'
  const forecastColor = isDark ? '#a5b4fc' : '#818cf8'
  const gridColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)'
  const axisColor = isDark ? '#64748b' : '#94a3b8'
  const markerColor = isDark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.45)'

  const { data, boundaryDate, maxValue } = useMemo(() => {
    const rows: Row[] = history.map((h) => ({ date: h.month, actual: h.netWorth, forecast: null }))
    // Bridge the boundary so the forecast line visually continues from the last actual.
    const boundary = history.length ? history[history.length - 1].month : result.startDate
    if (rows.length) rows[rows.length - 1].forecast = rows[rows.length - 1].actual

    for (const p of result.monthly) {
      rows.push({
        date: p.date,
        actual: null,
        forecast: p.netWorth,
        assets: p.totalAssets,
        liabilities: p.totalLiabilities,
        contributions: p.cumulativeContributions,
        returns: p.cumulativeReturns,
      })
    }
    const max = Math.max(...rows.map((r) => Math.max(r.actual ?? 0, r.forecast ?? 0)), 0)
    return { data: rows, boundaryDate: boundary, maxValue: max }
  }, [history, result])

  const visibleMilestones = FORECAST_MILESTONES.filter((m) => m.value <= maxValue * 1.05)

  return (
    <section className="nw-card p-5" aria-label="Net worth forecast">
      <div className="flex items-center gap-2.5 mb-4">
        <LineChartIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Net Worth Forecast</h2>
          <p className="text-xs nw-text-muted">
            Solid: actual history · dashed: {scenarioName} projection
          </p>
        </div>
      </div>

      <div className="h-72" role="img" aria-label={`Forecast reaching ${formatINR(result.endingNetWorth)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="fcActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={isDark ? 0.28 : 0.18} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fcForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={forecastColor} stopOpacity={isDark ? 0.18 : 0.12} />
                <stop offset="100%" stopColor={forecastColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(v: string) => v.split(' ')[1] ?? v}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(v: number) => formatAxisINR(v)}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<ForecastTooltip isDark={isDark} />} />

            {visibleMilestones.map((m) => (
              <ReferenceLine
                key={m.value}
                y={m.value}
                stroke={markerColor}
                strokeDasharray="2 4"
                label={{ value: m.label, position: 'insideTopRight', fontSize: 10, fill: axisColor }}
              />
            ))}

            <ReferenceLine
              x={boundaryDate}
              stroke={markerColor}
              strokeWidth={1.5}
              label={{ value: 'Forecast starts', position: 'insideTopLeft', fontSize: 10, fill: axisColor }}
            />

            <Area
              type="monotone"
              dataKey="actual"
              stroke={accent}
              strokeWidth={2}
              fill="url(#fcActual)"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke={forecastColor}
              strokeWidth={2}
              strokeDasharray="5 4"
              fill="url(#fcForecast)"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function ForecastTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload || !payload.length) return null
  const row: Row = payload[0].payload
  const value = row.forecast ?? row.actual ?? 0
  const isForecast = row.actual === null

  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        background: isDark ? '#1e2430' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
      }}
    >
      <p className="text-xs mb-0.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        {label} {isForecast ? '· forecast' : '· actual'}
      </p>
      <p className="tabnums font-semibold" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
        {formatINR(value)}
      </p>
      {isForecast && row.assets !== undefined && (
        <div className="mt-1 space-y-0.5 text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          <p className="tabnums">Assets {formatCompactINR(row.assets)}</p>
          {row.liabilities ? <p className="tabnums">Liabilities {formatCompactINR(row.liabilities)}</p> : null}
          <p className="tabnums">Contributed {formatCompactINR(row.contributions ?? 0)}</p>
          <p className="tabnums">Returns {formatCompactINR(row.returns ?? 0)}</p>
        </div>
      )}
    </div>
  )
}
