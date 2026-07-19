/**
 * Net Worth domain logic: shared types for the /api/comparison payload,
 * milestone helpers, and real-data insight calculators.
 *
 * All calculations here are pure and derive strictly from data already
 * present in the sheet — no invented figures.
 */

// ---------------------------------------------------------------------------
// API types (mirror /api/comparison and /api/sheets responses)
// ---------------------------------------------------------------------------

export interface AssetRow {
  category: string
  type: string
  item: string
  amount: number
}

export interface MonthData {
  month: string
  netWorth: number
  assets: AssetRow[]
  liabilities: AssetRow[]
  totalAssets: number
  totalLiabilities: number
  assetsByType: Record<string, number>
  costBasis: Record<string, number>
}

export interface ItemChange {
  item: string
  type: string
  change: number
  percent: number
  current: number
}

export interface Delta {
  current: number
  previous: number
  change: number
  percent: number
}

export interface PeriodComparison {
  period: string
  fromMonth: string
  toMonth: string
  netWorth: Delta
  assets: Delta
  liabilities: Delta
  byType: Record<string, Delta>
  keyAssets: Record<string, Delta>
  topChanges: ItemChange[]
  topGainers: ItemChange[]
  topLosers: ItemChange[]
}

export interface ComparisonResponse {
  months: MonthData[] // most-recent-first (as returned by the API)
  comparisons: {
    mom: PeriodComparison | null
    twoMonth: PeriodComparison | null
    threeMonth: PeriodComparison | null
    sixMonth: PeriodComparison | null
  }
}

/** A lightweight chronological (oldest -> newest) history point. */
export interface HistoryPoint {
  month: string
  netWorth: number
  totalAssets: number
  totalLiabilities: number
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export interface Milestone {
  value: number
  label: string
}

export const MILESTONES: Milestone[] = [
  { value: 10_000_000, label: '1 Crore' },
  { value: 20_000_000, label: '2 Crore' },
  { value: 30_000_000, label: '3 Crore' },
  { value: 40_000_000, label: '4 Crore' },
  { value: 50_000_000, label: '5 Crore' },
]

export const CAREER_START = { month: 8, year: 2021, label: 'Aug 2021' }

export interface MilestoneTimeline {
  milestone: Milestone
  achievedMonth: string
  monthsToReach: number
  journeyStart: string
}

// ---------------------------------------------------------------------------
// Month parsing
// ---------------------------------------------------------------------------

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

/** Parse "Aug 2021" or "Aug/21" into { month, year }. */
export function parseMonth(monthStr: string): { month: number; year: number } | null {
  if (!monthStr) return null
  const m1 = monthStr.match(/^(\w+)\s+(\d{4})$/i)
  if (m1) {
    const month = MONTH_MAP[m1[1].slice(0, 3).toLowerCase()]
    const year = parseInt(m1[2], 10)
    if (month) return { month, year }
  }
  const m2 = monthStr.match(/^(\w+)[/-](\d{2})$/i)
  if (m2) {
    const month = MONTH_MAP[m2[1].slice(0, 3).toLowerCase()]
    const year = 2000 + parseInt(m2[2], 10)
    if (month) return { month, year }
  }
  return null
}

export function monthsBetween(sm: number, sy: number, em: number, ey: number): number {
  return (ey - sy) * 12 + (em - sm)
}

/** Human duration from a month count, e.g. "2y 3m", "5m". */
export function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years > 0 && months > 0) return `${years}y ${months}m`
  if (years > 0) return `${years}y`
  return `${months}m`
}

/**
 * Build the milestone journey timeline from a chronological history.
 * @param history oldest -> newest
 */
export function computeMilestoneTimelines(history: HistoryPoint[]): MilestoneTimeline[] {
  const timelines: MilestoneTimeline[] = []
  let prevDate: { month: number; year: number } | null = null
  let prevLabel = CAREER_START.label

  for (let i = 0; i < MILESTONES.length; i++) {
    const milestone = MILESTONES[i]
    const crossingIndex = history.findIndex((d) => d.netWorth >= milestone.value)
    if (crossingIndex === -1) continue

    const achievedMonthStr = history[crossingIndex].month
    const achievedDate = parseMonth(achievedMonthStr)
    if (!achievedDate) continue

    let monthsToReach: number
    let journeyStart: string
    if (i === 0) {
      monthsToReach = monthsBetween(CAREER_START.month, CAREER_START.year, achievedDate.month, achievedDate.year)
      journeyStart = CAREER_START.label
    } else if (prevDate) {
      monthsToReach = monthsBetween(prevDate.month, prevDate.year, achievedDate.month, achievedDate.year)
      journeyStart = prevLabel
    } else {
      monthsToReach = crossingIndex + 1
      journeyStart = 'Start'
    }

    timelines.push({
      milestone,
      achievedMonth: achievedMonthStr,
      monthsToReach: Math.max(1, monthsToReach),
      journeyStart,
    })
    prevDate = achievedDate
    prevLabel = achievedMonthStr
  }
  return timelines
}

export function currentMilestone(netWorth: number): Milestone | undefined {
  return MILESTONES.filter((m) => netWorth >= m.value).pop()
}

export function nextMilestone(netWorth: number): Milestone | undefined {
  return MILESTONES.find((m) => netWorth < m.value)
}

// ---------------------------------------------------------------------------
// Real-data insights
// ---------------------------------------------------------------------------

export interface HighestEver {
  value: number
  month: string
  isCurrent: boolean
}

/** Highest recorded net worth across history (chronological). */
export function highestEver(history: HistoryPoint[]): HighestEver | null {
  if (history.length === 0) return null
  let best = history[0]
  for (const p of history) if (p.netWorth > best.netWorth) best = p
  const latest = history[history.length - 1]
  return { value: best.netWorth, month: best.month, isCurrent: best.month === latest.month }
}

/**
 * Consecutive months of net-worth increase ending at the most recent month.
 * Returns 0 if the latest month did not increase over the prior month.
 */
export function growthStreak(history: HistoryPoint[]): number {
  if (history.length < 2) return 0
  let streak = 0
  for (let i = history.length - 1; i > 0; i--) {
    if (history[i].netWorth > history[i - 1].netWorth) streak++
    else break
  }
  return streak
}

/** Ratio of assets to liabilities. Null when liabilities are zero. */
export function assetLiabilityRatio(totalAssets: number, totalLiabilities: number): number | null {
  if (totalLiabilities <= 0) return null
  return totalAssets / totalLiabilities
}

/** Latest month-over-month change from a chronological history. */
export function latestMonthlyChange(history: HistoryPoint[]): { change: number; percent: number } | null {
  if (history.length < 2) return null
  const last = history[history.length - 1]
  const prev = history[history.length - 2]
  const change = last.netWorth - prev.netWorth
  const percent = prev.netWorth !== 0 ? (change / prev.netWorth) * 100 : 0
  return { change, percent }
}

// ---------------------------------------------------------------------------
// Investment domain helpers (grounded in the sheet's item names)
// ---------------------------------------------------------------------------

/** Cost-basis <-> market-value pairs present in the sheet. */
export const INVESTMENT_PAIRS = [
  { label: 'Mutual Funds', cost: 'Invested Mutual Funds', market: 'Market Mutual Funds' },
  { label: 'Stocks', cost: 'Invested Stock', market: 'Market Value Stocks' },
]

/** Equity holdings (for concentration / diversification insight). */
export const EQUITY_ITEMS = ['Market Mutual Funds', 'Market Value Stocks']

/** Employer equity compensation holdings. */
export const EQUITY_COMP_ITEMS = ['ServiceNow Vested RSU', 'Uber Vested RSU', 'ESPP', 'Cash Leftover RSU']

/** Liquid asset types. */
export const LIQUID_TYPES = ['Liquid Asset']

function itemAmount(assets: AssetRow[], name: string): number {
  const found = assets.find((a) => a.item === name)
  return found ? found.amount : 0
}

export interface GainRow {
  label: string
  invested: number
  market: number
  gain: number
  percent: number | null
}

export interface GainsSummary {
  rows: GainRow[]
  totalInvested: number
  totalMarket: number
  totalGain: number
  totalPercent: number | null
}

/** Unrealized gains: market value vs cost basis for each investment pair. */
export function computeGains(assets: AssetRow[], costBasis: Record<string, number>): GainsSummary {
  const rows: GainRow[] = []
  for (const pair of INVESTMENT_PAIRS) {
    const invested = costBasis[pair.cost] ?? 0
    const market = itemAmount(assets, pair.market)
    if (invested <= 0 && market <= 0) continue
    const gain = market - invested
    rows.push({
      label: pair.label,
      invested,
      market,
      gain,
      percent: invested > 0 ? (gain / invested) * 100 : null,
    })
  }
  const totalInvested = rows.reduce((s, r) => s + r.invested, 0)
  const totalMarket = rows.reduce((s, r) => s + r.market, 0)
  const totalGain = totalMarket - totalInvested
  return {
    rows,
    totalInvested,
    totalMarket,
    totalGain,
    totalPercent: totalInvested > 0 ? (totalGain / totalInvested) * 100 : null,
  }
}

/** Liquid assets and their share of net worth. */
export function liquidity(assets: AssetRow[], netWorth: number): { amount: number; percent: number } {
  const amount = assets.filter((a) => LIQUID_TYPES.includes(a.type)).reduce((s, a) => s + a.amount, 0)
  return { amount, percent: netWorth > 0 ? (amount / netWorth) * 100 : 0 }
}

/** Separate real debt from tax provisions among liabilities. */
export function debtProfile(liabilities: AssetRow[]): {
  debt: number
  taxProvision: number
  isDebtFree: boolean
} {
  let debt = 0
  let taxProvision = 0
  for (const l of liabilities) {
    if (/tax/i.test(l.item)) taxProvision += l.amount
    else debt += l.amount
  }
  return { debt, taxProvision, isDebtFree: debt <= 0 }
}

/** Equity exposure (MF + stocks market value) as a share of net worth. */
export function equityExposure(assets: AssetRow[], netWorth: number): { amount: number; percent: number } {
  const amount = EQUITY_ITEMS.reduce((s, name) => s + itemAmount(assets, name), 0)
  return { amount, percent: netWorth > 0 ? (amount / netWorth) * 100 : 0 }
}

/** Total vested employer equity compensation. */
export function equityCompensation(assets: AssetRow[]): { amount: number; items: AssetRow[] } {
  const items = assets.filter((a) => EQUITY_COMP_ITEMS.includes(a.item) && a.amount > 0)
  return { amount: items.reduce((s, a) => s + a.amount, 0), items }
}

/** Annualized net-worth growth rate (CAGR) across the history. */
export function annualizedGrowth(history: HistoryPoint[]): number | null {
  if (history.length < 2) return null
  const first = history[0]
  const last = history[history.length - 1]
  if (first.netWorth <= 0) return null
  const months = history.length - 1
  const years = months / 12
  if (years <= 0) return null
  return (Math.pow(last.netWorth / first.netWorth, 1 / years) - 1) * 100
}

export interface TrailingGrowth {
  months: number
  change: number
  percent: number | null
  avgPerMonth: number
}

/**
 * Growth over the trailing window (up to `maxMonths`) ending at the latest
 * month, plus the average monthly change across that window.
 */
export function trailingGrowth(history: HistoryPoint[], maxMonths = 12): TrailingGrowth | null {
  if (history.length < 2) return null
  const endIdx = history.length - 1
  const startIdx = Math.max(0, endIdx - maxMonths)
  const months = endIdx - startIdx
  if (months <= 0) return null
  const start = history[startIdx].netWorth
  const change = history[endIdx].netWorth - start
  return {
    months,
    change,
    percent: start !== 0 ? (change / start) * 100 : null,
    avgPerMonth: change / months,
  }
}

export interface HoldingRow {
  item: string
  type: string
  amount: number
  change: number | null
  percentOfNetWorth: number
}

/** Per-holding breakdown with month-over-month change and share of net worth. */
export function holdingsBreakdown(
  assets: AssetRow[],
  prevAssets: AssetRow[] | null,
  netWorth: number,
): HoldingRow[] {
  const prevMap = new Map((prevAssets ?? []).map((a) => [a.item, a.amount]))
  return assets
    .filter((a) => a.amount !== 0)
    .map((a) => {
      const prev = prevMap.get(a.item)
      return {
        item: a.item,
        type: a.type,
        amount: a.amount,
        change: prev === undefined ? null : a.amount - prev,
        percentOfNetWorth: netWorth > 0 ? (a.amount / netWorth) * 100 : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

/** Convert the API's most-recent-first months into a chronological history. */
export function toHistory(months: MonthData[]): HistoryPoint[] {
  return [...months]
    .reverse()
    .map((m) => ({
      month: m.month,
      netWorth: m.netWorth,
      totalAssets: m.totalAssets,
      totalLiabilities: m.totalLiabilities,
    }))
}
