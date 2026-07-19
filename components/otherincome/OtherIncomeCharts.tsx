'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp, BarChart3, LineChart as LineChartIcon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatAxisINR, formatINR, formatCompactINR } from '@/lib/format'
import { FYSummary, cumulativeEarnings, monthShort } from '@/lib/otherIncome'

const ACCENT = '#6366f1'

function useChartTheme() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return {
    isDark,
    gridColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.07)',
    axisColor: isDark ? '#64748b' : '#94a3b8',
  }
}

function MoneyTooltip({ active, payload, label, isDark, hidden, name }: any) {
  if (!active || !payload || !payload.length) return null
  const value = payload[payload.length - 1].value ?? 0
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        background: isDark ? '#1e2430' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
      }}
    >
      <p className="text-xs mb-0.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</p>
      <p className="tabnums font-semibold" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
        {hidden ? '••••••' : formatINR(value)}
      </p>
      {name && <p className="text-[11px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{name}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cumulative lifetime earnings                                        */
/* ------------------------------------------------------------------ */

export function CumulativeEarningsChart({ monthlyTrend }: { monthlyTrend: { month: string; amount: number }[] }) {
  const { isDark, gridColor, axisColor } = useChartTheme()
  const { hidden } = usePrivacy()
  const data = useMemo(() => cumulativeEarnings(monthlyTrend), [monthlyTrend])
  const latest = data[data.length - 1]?.cumulative ?? 0

  return (
    <section className="nw-card p-5 h-full" aria-label="Cumulative earnings over time">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <LineChartIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h2 className="text-base font-semibold nw-text-primary">Lifetime Earnings</h2>
            <p className="text-xs nw-text-muted">Cumulative income to date</p>
          </div>
        </div>
        {latest > 0 && (
          <span className="tabnums text-sm font-semibold nw-text-primary">
            {hidden ? '••••••' : formatCompactINR(latest, 1)}
          </span>
        )}
      </div>

      {data.length < 2 ? (
        <EmptyChart icon={<LineChartIcon className="h-8 w-8 nw-text-muted" />} />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="oiCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={isDark ? 0.28 : 0.18} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                tickFormatter={(v: number) => (hidden ? '•••' : formatAxisINR(v))}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<MoneyTooltip isDark={isDark} hidden={hidden} name="cumulative" />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#oiCumulative)"
                dot={false}
                activeDot={{ r: 4, stroke: isDark ? '#0b0e14' : '#ffffff', strokeWidth: 2, fill: ACCENT }}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Monthly earnings timeline                                           */
/* ------------------------------------------------------------------ */

export function EarningsTimelineChart({ monthlyTrend }: { monthlyTrend: { month: string; amount: number }[] }) {
  const { isDark, gridColor, axisColor } = useChartTheme()
  const { hidden } = usePrivacy()
  const data = useMemo(() => monthlyTrend.map((m) => ({ ...m, label: monthShort(m.month) })), [monthlyTrend])

  return (
    <section className="nw-card p-5 h-full" aria-label="Monthly earnings">
      <div className="flex items-center gap-2.5 mb-4">
        <BarChart3 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Earnings Timeline</h2>
          <p className="text-xs nw-text-muted">Income booked each month</p>
        </div>
      </div>

      {data.length < 2 ? (
        <EmptyChart icon={<BarChart3 className="h-8 w-8 nw-text-muted" />} />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} minTickGap={16} />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                tickFormatter={(v: number) => (hidden ? '•••' : formatAxisINR(v))}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip cursor={{ fill: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)' }} content={<MoneyTooltip isDark={isDark} hidden={hidden} name="this month" />} />
              <Bar dataKey="amount" fill={ACCENT} radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Earnings by financial year                                          */
/* ------------------------------------------------------------------ */

export function FYEarningsChart({ fyBreakdown }: { fyBreakdown: FYSummary[] }) {
  const { isDark, gridColor, axisColor } = useChartTheme()
  const { hidden } = usePrivacy()
  const data = useMemo(
    () =>
      [...fyBreakdown]
        .sort((a, b) => a.fy.localeCompare(b.fy))
        .map((fy) => ({ name: `FY ${fy.fy}`, earnings: fy.totalINR, courses: fy.courseCount })),
    [fyBreakdown],
  )

  return (
    <section className="nw-card p-5 h-full" aria-label="Earnings by financial year">
      <div className="flex items-center gap-2.5 mb-4">
        <TrendingUp className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">By Financial Year</h2>
          <p className="text-xs nw-text-muted">Gross earnings per FY</p>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyChart icon={<TrendingUp className="h-8 w-8 nw-text-muted" />} />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                tickFormatter={(v: number) => (hidden ? '•••' : formatAxisINR(v))}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.04)' }}
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload
                  return (
                    <div
                      className="rounded-xl px-3 py-2 text-xs shadow-lg"
                      style={{
                        background: isDark ? '#1e2430' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'}`,
                      }}
                    >
                      <p className="mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</p>
                      <p className="tabnums font-semibold" style={{ color: isDark ? '#e6eaf0' : '#0f172a' }}>
                        {hidden ? '••••••' : formatINR(row.earnings)}
                      </p>
                      <p className="text-[11px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{row.courses} course{row.courses !== 1 ? 's' : ''}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="earnings" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i === data.length - 1 ? ACCENT : isDark ? '#475569' : '#c7d2fe'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function EmptyChart({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
      {icon}
      <p className="text-sm nw-text-secondary">Not enough data to plot yet</p>
    </div>
  )
}
