'use client'

import { useMemo, useState } from 'react'
import {
  Timer,
  CalendarDays,
  Gauge,
  Zap,
  Receipt,
  Clock,
  CheckCircle,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatINR, formatCompactINR } from '@/lib/format'
import {
  CourseInsights,
  CoursePace,
  IncomeEntry,
  TaxByFY,
  daysSince,
  formatUSD,
  isPending,
} from '@/lib/otherIncome'

/* ------------------------------------------------------------------ */
/* Publishing momentum                                                 */
/* ------------------------------------------------------------------ */

export function PublishingMomentum({ insights }: { insights: CourseInsights }) {
  const sinceLast = daysSince(insights.lastCourse?.date)
  const overdue = sinceLast != null && insights.avgGapDays > 0 && sinceLast > insights.avgGapDays
  const yoyDelta = insights.coursesThisYear - insights.coursesLastYear

  return (
    <section className="nw-card p-5 h-full" aria-label="Publishing momentum">
      <div className="flex items-center gap-2.5 mb-4">
        <Zap className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Publishing Momentum</h2>
          <p className="text-xs nw-text-muted">Your course cadence</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          icon={<Clock className="h-4 w-4" />}
          tone={overdue ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10' : 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'}
          label="Since last course"
          value={sinceLast != null ? `${sinceLast} days` : '—'}
          sub={insights.avgGapDays > 0 ? (overdue ? `past ~${insights.avgGapDays}d avg` : `avg ~${insights.avgGapDays}d`) : undefined}
        />
        <Tile
          icon={<CalendarDays className="h-4 w-4" />}
          tone="text-sky-600 dark:text-sky-400 bg-sky-500/10"
          label="Avg gap"
          value={insights.avgGapDays > 0 ? `${insights.avgGapDays} days` : '—'}
          sub="between courses"
        />
        <Tile
          icon={<TrendingUp className="h-4 w-4" />}
          tone={yoyDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-red-600 dark:text-red-400 bg-red-500/10'}
          label="This year"
          value={`${insights.coursesThisYear} course${insights.coursesThisYear !== 1 ? 's' : ''}`}
          sub={`vs ${insights.coursesLastYear} last yr${insights.coursesLastYear > 0 ? ` (${yoyDelta >= 0 ? '+' : ''}${yoyDelta})` : ''}`}
        />
        <Tile
          icon={<Timer className="h-4 w-4" />}
          tone="text-teal-600 dark:text-teal-400 bg-teal-500/10"
          label="Fastest turnaround"
          value={insights.shortestGap ? `${insights.shortestGap.days} days` : '—'}
          sub={insights.longestGap ? `longest ${insights.longestGap.days}d` : undefined}
        />
      </div>

      {insights.firstCourse && insights.lastCourse && (
        <div className="mt-4 pt-3 border-t nw-hairline flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <span className="nw-text-muted">
            First: <span className="nw-text-secondary font-medium">{insights.firstCourse.date}</span>
          </span>
          <span className="nw-text-muted">
            Latest: <span className="nw-text-secondary font-medium">{insights.lastCourse.date}</span>
          </span>
          <span className="nw-text-muted">
            Total: <span className="nw-text-secondary font-medium">{insights.totalCourses} courses</span>
          </span>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Compact tax summary                                                 */
/* ------------------------------------------------------------------ */

export function TaxSummaryCard({
  liability,
  paid,
  due,
  effectiveRate,
  byFY = [],
}: {
  liability: number
  paid: number
  due: number
  effectiveRate: number
  byFY?: TaxByFY[]
}) {
  const { mask } = usePrivacy()
  const pct = liability > 0 ? Math.min((paid / liability) * 100, 100) : 100
  const rows = [...byFY]
    .filter((t) => t.totalTaxDue > 0 || t.paymentDone > 0 || t.paymentDue > 0)
    .sort((a, b) => b.fy.localeCompare(a.fy))

  return (
    <section className="nw-card p-5 h-full" aria-label="Tax tracker">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Receipt className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h2 className="text-base font-semibold nw-text-primary">Tax Tracker</h2>
            <p className="text-xs nw-text-muted">Advance tax — paid vs due by FY</p>
          </div>
        </div>
        <span className="tabnums text-xs font-medium nw-text-secondary">{effectiveRate.toFixed(1)}% effective</span>
      </div>

      <div className={`grid gap-5 ${rows.length > 0 ? 'lg:grid-cols-2' : ''}`}>
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Liability" value={mask(formatCompactINR(liability, 1))} />
            <Stat label="Paid" value={mask(formatCompactINR(paid, 1))} valueClass="nw-gain" />
            <Stat label="Due" value={mask(formatCompactINR(due, 1))} valueClass={due > 0 ? 'nw-loss' : undefined} />
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] nw-text-muted flex items-center gap-1">
            {due <= 0 ? <CheckCircle className="h-3.5 w-3.5 nw-gain" /> : null}
            {pct.toFixed(0)}% of tax liability paid
          </p>
        </div>

        {rows.length > 0 && (
          <div className="lg:border-l nw-hairline lg:pl-5">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-5 gap-y-2 items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider nw-text-muted">FY</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider nw-text-muted text-right">Liability</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider nw-text-muted text-right">Paid</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider nw-text-muted text-right">Due</span>
              {rows.map((t) => (
                <FragmentRow key={t.fy} t={t} mask={mask} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function FragmentRow({ t, mask }: { t: TaxByFY; mask: (s: string) => string }) {
  const settled = t.paymentDue <= 0
  return (
    <>
      <span className="flex items-center gap-2 min-w-0">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${settled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span className="text-sm nw-text-primary truncate">FY {t.fy}</span>
      </span>
      <span className="tabnums text-sm nw-text-secondary text-right whitespace-nowrap">{mask(formatCompactINR(t.totalTaxDue, 1))}</span>
      <span className="tabnums text-sm nw-gain text-right whitespace-nowrap">{mask(formatCompactINR(t.paymentDone, 1))}</span>
      <span className={`tabnums text-sm text-right whitespace-nowrap ${settled ? 'nw-text-muted' : 'nw-loss'}`}>
        {settled ? 'Paid' : mask(formatCompactINR(t.paymentDue, 1))}
      </span>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Course pace — "am I on track?"                                      */
/* ------------------------------------------------------------------ */

export function CoursePaceCard({ pace }: { pace: CoursePace }) {
  const { onTrackVsLastYear, deltaVsLastYear, thisYear, lastYearToDate, lastYearTotal, avgPerYear, projected, currentYear, asOfMonth } = pace
  const target = Math.max(lastYearToDate, avgPerYear * pace.yearElapsed, 0.001)
  const pacePct = Math.min((thisYear / target) * 100, 100)

  return (
    <section className="nw-card p-5 h-full flex flex-col" aria-label="Course pace tracker">
      <div className="flex items-center gap-2.5 mb-4">
        <Gauge className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Course Pace</h2>
          <p className="text-xs nw-text-muted">On track for {currentYear}?</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="tabnums text-3xl font-bold nw-text-primary leading-none">{thisYear}</p>
          <p className="text-xs nw-text-muted mt-1">published in {currentYear}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            onTrackVsLastYear ? 'bg-emerald-500/10 nw-gain' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}
        >
          {onTrackVsLastYear ? <TrendingUp className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {onTrackVsLastYear ? 'On track' : 'Behind'}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${onTrackVsLastYear ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'}`}
          style={{ width: `${pacePct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] nw-text-muted">
        By {asOfMonth} {currentYear - 1} you had <span className="nw-text-secondary font-medium">{lastYearToDate}</span>
        {deltaVsLastYear !== 0 && (
          <span className={deltaVsLastYear > 0 ? ' nw-gain' : ' nw-loss'}> ({deltaVsLastYear > 0 ? '+' : ''}{deltaVsLastYear})</span>
        )}
      </p>

      <div className="mt-auto pt-4 grid grid-cols-3 gap-3">
        <Stat label="Projected" value={`${projected}`} />
        <Stat label="Avg / yr" value={avgPerYear > 0 ? avgPerYear.toFixed(1) : '—'} />
        <Stat label={`${currentYear - 1} total`} value={`${lastYearTotal}`} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Pending pipeline                                                    */
/* ------------------------------------------------------------------ */

export function PendingPipeline({ entries }: { entries: IncomeEntry[] }) {
  const { mask } = usePrivacy()
  const pending = useMemo(
    () =>
      entries
        .filter((e) => isPending(e.status))
        .sort((a, b) => (b.actual || b.estimate) - (a.actual || a.estimate)),
    [entries],
  )
  const total = pending.reduce((s, e) => s + (e.actual || e.estimate), 0)

  return (
    <section className="nw-card p-5 h-full" aria-label="Pending pipeline">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h2 className="text-base font-semibold nw-text-primary">Pipeline</h2>
            <p className="text-xs nw-text-muted">Invoices awaiting payment</p>
          </div>
        </div>
        <div className="text-right">
          <p className="tabnums text-lg font-bold nw-text-primary">{mask(formatCompactINR(total, 1))}</p>
          <p className="text-[11px] nw-text-muted">{pending.length} pending</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-sm nw-text-secondary">
          <CheckCircle className="h-4 w-4 nw-gain" /> All invoices paid — nothing outstanding.
        </div>
      ) : (
        <ul className="divide-y nw-hairline">
          {pending.slice(0, 5).map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm nw-text-primary truncate" title={e.description}>{e.description}</span>
                <span className="text-[11px] nw-text-muted">FY {e.fy} · {e.invoiceDate || 'no date'}</span>
              </span>
              <span className="tabnums text-sm font-medium nw-text-primary shrink-0">
                {mask(formatCompactINR(e.actual || e.estimate, 1))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Top courses                                                         */
/* ------------------------------------------------------------------ */

export function TopCourses({ courses }: { courses: IncomeEntry[] }) {
  const { mask } = usePrivacy()
  const max = courses[0] ? courses[0].actual || courses[0].estimate : 1

  return (
    <section className="nw-card p-5 h-full" aria-label="Top earning courses">
      <div className="flex items-center gap-2.5 mb-4">
        <Award className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Top Earning Courses</h2>
          <p className="text-xs nw-text-muted">Your best performing content</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm nw-text-secondary">No courses recorded.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((c, i) => {
            const amount = c.actual || c.estimate
            return (
              <li key={i}>
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center h-6 w-6 rounded-md text-xs font-bold tabnums bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm nw-text-primary truncate min-w-0 flex-1" title={c.description}>{c.description}</span>
                  <span className="tabnums text-sm font-semibold nw-text-primary shrink-0">{mask(formatCompactINR(amount, 1))}</span>
                </div>
                <div className="mt-1 ml-9 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                  <div className="h-full rounded-full bg-indigo-500/70 dark:bg-indigo-400/70" style={{ width: `${Math.max(4, Math.min((amount / max) * 100, 100))}%` }} />
                </div>
                <p className="mt-0.5 ml-9 text-[11px] nw-text-muted">
                  FY {c.fy} · {c.invoiceDate} · <span className={isPending(c.status) ? 'text-amber-600 dark:text-amber-400' : 'nw-gain'}>{c.status}</span>
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* All entries table                                                   */
/* ------------------------------------------------------------------ */

export function EntriesTable({ entries }: { entries: IncomeEntry[] }) {
  const { mask } = usePrivacy()
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const rows = showAll ? entries : entries.slice(0, 10)

  return (
    <section className="nw-card overflow-hidden" aria-label="All income entries">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 border-b nw-hairline hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <h2 className="text-base font-semibold nw-text-primary">All Entries</h2>
          <span className="text-xs nw-text-muted">{entries.length}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 nw-text-muted" /> : <ChevronDown className="h-4 w-4 nw-text-muted" />}
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b nw-hairline">
                {['Description', 'FY', 'Date', 'Status', 'USD', 'INR'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[11px] font-semibold nw-text-muted uppercase tracking-wider ${i >= 4 ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y nw-hairline">
              {rows.map((e, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 max-w-xs">
                    <span className="block text-sm nw-text-primary truncate" title={e.description}>{e.description}</span>
                  </td>
                  <td className="px-5 py-3 text-sm nw-text-secondary whitespace-nowrap">{e.fy}</td>
                  <td className="px-5 py-3 text-sm nw-text-secondary whitespace-nowrap">{e.invoiceDate}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isPending(e.status)
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      }`}
                    >
                      {isPending(e.status) ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                      {e.status || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabnums text-sm nw-text-secondary whitespace-nowrap">{mask(formatUSD(e.totalUSD))}</td>
                  <td className="px-5 py-3 text-right tabnums text-sm font-medium nw-text-primary whitespace-nowrap">{mask(formatINR(e.actual || e.estimate))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {entries.length > 10 && (
            <div className="p-3 text-center border-t nw-hairline">
              <button onClick={() => setShowAll((s) => !s)} className="nw-control px-3 py-1.5 border nw-hairline text-sm">
                {showAll ? 'Show less' : `Show all ${entries.length}`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Tile({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  tone: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="nw-inset p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`grid place-items-center h-6 w-6 rounded-md ${tone}`}>{icon}</span>
        <span className="text-[11px] nw-text-secondary truncate">{label}</span>
      </div>
      <p className="tabnums text-sm font-semibold nw-text-primary truncate">{value}</p>
      {sub && <p className="text-[11px] nw-text-muted truncate mt-0.5">{sub}</p>}
    </div>
  )
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="nw-inset p-3">
      <p className="text-[11px] nw-text-muted mb-1">{label}</p>
      <p className={`tabnums text-sm font-semibold truncate ${valueClass ?? 'nw-text-primary'}`} title={value}>{value}</p>
    </div>
  )
}
