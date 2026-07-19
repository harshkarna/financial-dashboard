/**
 * Types and helpers for the Other Income (courses / royalties / misc) tab.
 * The API already does most aggregation; here we add the few derived views
 * the redesigned UI needs (cumulative curve, publishing cadence, labels).
 */

export interface IncomeEntry {
  description: string
  type: string
  status: string
  fy: string
  invoiceDate: string
  totalUSD: number
  estimate: number
  actual: number
  tax: number
  actualPostTax: number
  rateConversion: number
  category: 'course' | 'royalty' | 'miscellaneous'
}

export interface CategoryData {
  count: number
  totalINR: number
  totalINRPostTax: number
  entries: IncomeEntry[]
}

export interface TaxByFY {
  fy: string
  totalReceivedUSD: number
  totalReceivedINR: number
  otherTaxes: number
  totalTaxDue: number
  totalReceivedPostTax: number
  paymentDone: number
  paymentDue: number
}

export interface FYSummary {
  fy: string
  totalUSD: number
  totalINR: number
  totalINRPostTax: number
  courseCount: number
  avgCourseEarning: number
  avgCourseEarningPostTax: number
  paidCount: number
  pendingCount: number
  pendingAmount: number
}

export interface CourseGap {
  days: number
  fromCourse: string
  toCourse: string
  fromDate: string
  toDate: string
}

export interface CourseInsights {
  shortestGap: CourseGap | null
  longestGap: CourseGap | null
  avgGapDays: number
  totalCourses: number
  firstCourse: { name: string; date: string } | null
  lastCourse: { name: string; date: string } | null
  coursesThisYear: number
  coursesLastYear: number
}

export interface OtherIncomeData {
  summary: {
    totalEarningsUSD: number
    totalEarningsINR: number
    totalEarningsINRPostTax: number
    realEarningsINR: number
    totalCourses: number
    paidCourses: number
    pendingPayments: number
    pendingCount: number
    avgCourseEarning: number
    avgCourseEarningPostTax: number
    avgConversionRate: number
  }
  categories: {
    courses: CategoryData
    royalties: CategoryData
    miscellaneous: CategoryData
  }
  taxes: {
    totalTaxesPaid: number
    totalTaxesDue: number
    totalTaxLiability: number
    effectiveTaxRate: number
    byFY: TaxByFY[]
    sheetGrandTotals?: unknown
  }
  fyBreakdown: FYSummary[]
  fyComparison: {
    currentFY: string
    currentFYData: FYSummary | null
    previousFYData: FYSummary | null
    yoyGrowth: number
  }
  topCourses: IncomeEntry[]
  courseInsights: CourseInsights
  entries: IncomeEntry[]
  monthlyTrend: { month: string; amount: number; usd: number }[]
}

/** "$12,345" — compact-ish USD for secondary figures. */
export function formatUSD(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

/** "Jan 2024" -> "Jan '24" for tight chart axes. */
export function monthShort(label: string): string {
  const parts = (label || '').split(' ')
  if (parts.length < 2) return label
  return `${parts[0]} '${parts[1].slice(2)}`
}

export interface CumulativePoint {
  month: string
  label: string
  amount: number
  cumulative: number
}

/** Running total of monthly earnings (API returns monthlyTrend pre-sorted). */
export function cumulativeEarnings(
  monthlyTrend: { month: string; amount: number }[],
): CumulativePoint[] {
  let running = 0
  return monthlyTrend.map((m) => {
    running += m.amount
    return { month: m.month, label: monthShort(m.month), amount: m.amount, cumulative: running }
  })
}

/** Parse a "M/D/YYYY" invoice date. */
export function parseInvoiceDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length < 3) return null
  const month = parseInt(parts[0], 10) - 1
  const day = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null
  return new Date(year, month, day)
}

/** Whole days between a date string and now (null if unparseable). */
export function daysSince(dateStr: string | undefined): number | null {
  if (!dateStr) return null
  const d = parseInvoiceDate(dateStr)
  if (!d) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

export function isPending(status: string): boolean {
  const s = (status || '').toLowerCase()
  return s.includes('to be paid') || s === 'pending' || s === 'unpaid'
}

export interface CoursePace {
  /** Courses published so far in the current calendar year. */
  thisYear: number
  /** Courses published by this same date last calendar year. */
  lastYearToDate: number
  /** Total courses published last calendar year. */
  lastYearTotal: number
  /** Average courses per year across prior complete years. */
  avgPerYear: number
  /** Run-rate projection for the full current year. */
  projected: number
  /** thisYear − lastYearToDate. */
  deltaVsLastYear: number
  onTrackVsLastYear: boolean
  currentYear: number
  /** Short month label for the "by <month>" comparison, e.g. "Jul". */
  asOfMonth: string
  /** Fraction of the current year elapsed (0–1). */
  yearElapsed: number
}

/**
 * Pace / "am I on track?" analysis for course publishing, comparing the current
 * calendar year-to-date against the same point last year and a run-rate projection.
 */
export function computeCoursePace(courses: IncomeEntry[]): CoursePace {
  const now = new Date()
  const currentYear = now.getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)
  const daysInYear =
    (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0 ? 366 : 365
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1
  const yearElapsed = Math.min(1, dayOfYear / daysInYear)

  const dated = courses
    .map((c) => ({ c, d: parseInvoiceDate(c.invoiceDate) }))
    .filter((x): x is { c: IncomeEntry; d: Date } => x.d !== null)

  const thisYear = dated.filter((x) => x.d.getFullYear() === currentYear).length

  const cutoffLastYear = new Date(currentYear - 1, now.getMonth(), now.getDate()).getTime()
  const lastYearToDate = dated.filter(
    (x) => x.d.getFullYear() === currentYear - 1 && x.d.getTime() <= cutoffLastYear,
  ).length
  const lastYearTotal = dated.filter((x) => x.d.getFullYear() === currentYear - 1).length

  const yearCounts = new Map<number, number>()
  dated.forEach((x) => {
    const y = x.d.getFullYear()
    if (y < currentYear) yearCounts.set(y, (yearCounts.get(y) || 0) + 1)
  })
  const priorCounts = Array.from(yearCounts.values())
  const avgPerYear = priorCounts.length
    ? priorCounts.reduce((a, b) => a + b, 0) / priorCounts.length
    : 0

  const projected = yearElapsed > 0 ? Math.round(thisYear / yearElapsed) : thisYear

  return {
    thisYear,
    lastYearToDate,
    lastYearTotal,
    avgPerYear,
    projected,
    deltaVsLastYear: thisYear - lastYearToDate,
    onTrackVsLastYear: thisYear >= lastYearToDate,
    currentYear,
    asOfMonth: now.toLocaleString('en-US', { month: 'short' }),
    yearElapsed,
  }
}
