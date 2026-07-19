/**
 * Types and client-side aggregations for the Budget experience.
 * The API returns raw per-line expenses and per-month income; we do all
 * the shaping here so charts and insights stay consistent and testable.
 */

export interface ExpenseItem {
  month: string // "Oct/25"
  category: string
  breakdown: string
  amount: number
  year: number
}

export interface IncomeItem {
  month: string
  incomeSource1: number
  incomeSource2: number
  otherIncome: number
  otherTaxDeduction: number
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  year: number
}

export interface BudgetResponse {
  expenses: ExpenseItem[]
  income: IncomeItem[]
  availableMonths: string[]
  availableYears: number[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface ParsedMonth {
  name: string
  index: number // 0-11
  year: number
}

export function parseMonth(month: string): ParsedMonth {
  const [namePart, yearPart] = (month || '').split('/')
  const name = (namePart || '').trim()
  const index = MONTHS.findIndex((m) => m.toLowerCase() === name.toLowerCase())
  const year = yearPart ? 2000 + parseInt(yearPart, 10) : NaN
  return { name, index, year }
}

/** Compare two raw month strings chronologically (oldest → newest). */
export function compareMonths(a: string, b: string): number {
  const pa = parseMonth(a)
  const pb = parseMonth(b)
  if (pa.year !== pb.year) return (pa.year || 0) - (pb.year || 0)
  return pa.index - pb.index
}

/** X-axis label: bare month within one year, else "Oct '25". */
export function monthLabel(month: string, showYear: boolean): string {
  const p = parseMonth(month)
  if (!showYear) return p.name
  const yy = isNaN(p.year) ? '' : ` '${String(p.year).slice(2)}`
  return `${p.name}${yy}`
}

export interface Totals {
  income: number
  expenses: number
  savings: number
  savingsRate: number
}

export function totalsFromIncome(income: IncomeItem[]): Totals {
  const inc = income.reduce((s, r) => s + r.totalIncome, 0)
  const exp = income.reduce((s, r) => s + r.totalExpenses, 0)
  const sav = income.reduce((s, r) => s + r.totalSavings, 0)
  return { income: inc, expenses: exp, savings: sav, savingsRate: inc > 0 ? (sav / inc) * 100 : 0 }
}

export interface CategoryTotal {
  category: string
  amount: number
  percent: number
  count: number
}

export function categoryTotals(expenses: ExpenseItem[]): CategoryTotal[] {
  const totals = new Map<string, { amount: number; count: number }>()
  let grand = 0
  for (const e of expenses) {
    const cat = e.category?.trim() || 'Uncategorized'
    const cur = totals.get(cat) || { amount: 0, count: 0 }
    cur.amount += e.amount
    cur.count += 1
    totals.set(cat, cur)
    grand += e.amount
  }
  return Array.from(totals.entries())
    .map(([category, v]) => ({
      category,
      amount: v.amount,
      count: v.count,
      percent: grand > 0 ? (v.amount / grand) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface CategoryOverTime {
  rows: Record<string, number | string>[]
  categories: string[] // top categories kept as bands (may include "Other")
}

/** Stacked-area data: top `topN` categories over time, remainder folded into "Other". */
export function categoryOverTime(expenses: ExpenseItem[], topN = 6): CategoryOverTime {
  if (expenses.length === 0) return { rows: [], categories: [] }

  const ranked = categoryTotals(expenses)
  const top = ranked.slice(0, topN).map((c) => c.category)
  const hasOther = ranked.length > topN
  const categories = hasOther ? [...top, 'Other'] : top
  const topSet = new Set(top)

  const byMonth = new Map<string, Record<string, number>>()
  for (const e of expenses) {
    const bucket = byMonth.get(e.month) || {}
    const cat = e.category?.trim() || 'Uncategorized'
    const key = topSet.has(cat) ? cat : 'Other'
    bucket[key] = (bucket[key] || 0) + e.amount
    byMonth.set(e.month, bucket)
  }

  const rows = Array.from(byMonth.keys())
    .sort(compareMonths)
    .map((month) => {
      const row: Record<string, number | string> = { month }
      for (const c of categories) row[c] = byMonth.get(month)?.[c] || 0
      return row
    })

  return { rows, categories }
}

export interface CashflowPoint {
  month: string
  income: number
  expenses: number
  savings: number
  savingsRate: number
}

export function cashflowTrend(income: IncomeItem[]): CashflowPoint[] {
  return [...income]
    .sort((a, b) => compareMonths(a.month, b.month))
    .map((r) => ({
      month: r.month,
      income: r.totalIncome,
      expenses: r.totalExpenses,
      savings: r.totalSavings,
      savingsRate: r.totalIncome > 0 ? (r.totalSavings / r.totalIncome) * 100 : 0,
    }))
}

export interface LineItem {
  breakdown: string
  category: string
  amount: number
  count: number
}

/** Aggregate individual line items by their breakdown text (merchant / item). */
export function topLineItems(expenses: ExpenseItem[], n = 8): LineItem[] {
  const map = new Map<string, LineItem>()
  for (const e of expenses) {
    const label = e.breakdown?.trim() || e.category?.trim() || 'Other'
    const key = label.toLowerCase()
    const cur = map.get(key) || { breakdown: label, category: e.category?.trim() || '', amount: 0, count: 0 }
    cur.amount += e.amount
    cur.count += 1
    map.set(key, cur)
  }
  return Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n)
}

export function biggestExpenses(expenses: ExpenseItem[], n = 5): ExpenseItem[] {
  return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, n)
}

/**
 * Average monthly expenditure over the most recent `months` months that have
 * expense data. Independent of any selected-month scope, so it reflects a true
 * rolling average rather than a single month. `count` is how many months were
 * actually available (may be < requested).
 */
export function avgMonthlyExpenditure(
  income: IncomeItem[],
  months: number,
): { avg: number; total: number; count: number } {
  const withData = income
    .filter((i) => i.totalExpenses > 0)
    .sort((a, b) => compareMonths(a.month, b.month))
  const window = withData.slice(-months)
  if (window.length === 0) return { avg: 0, total: 0, count: 0 }
  const total = window.reduce((s, r) => s + r.totalExpenses, 0)
  return { avg: total / window.length, total, count: window.length }
}

export interface CategoryMover {
  category: string
  current: number
  previous: number
  change: number
  percent: number | null
}

/**
 * Compare per-category spend between the last month and the month before it
 * within `expenses`. Returns movers sorted by absolute change.
 */
export function categoryMovers(expenses: ExpenseItem[]): {
  latestMonth: string | null
  priorMonth: string | null
  movers: CategoryMover[]
} {
  const months = Array.from(new Set(expenses.map((e) => e.month))).sort(compareMonths)
  if (months.length < 2) return { latestMonth: months[0] ?? null, priorMonth: null, movers: [] }

  const latestMonth = months[months.length - 1]
  const priorMonth = months[months.length - 2]

  const sumByCat = (month: string) => {
    const m = new Map<string, number>()
    for (const e of expenses) {
      if (e.month !== month) continue
      const cat = e.category?.trim() || 'Uncategorized'
      m.set(cat, (m.get(cat) || 0) + e.amount)
    }
    return m
  }

  const cur = sumByCat(latestMonth)
  const prev = sumByCat(priorMonth)
  const cats = new Set<string>([...Array.from(cur.keys()), ...Array.from(prev.keys())])

  const movers: CategoryMover[] = Array.from(cats).map((category) => {
    const current = cur.get(category) || 0
    const previous = prev.get(category) || 0
    const change = current - previous
    return {
      category,
      current,
      previous,
      change,
      percent: previous > 0 ? (change / previous) * 100 : null,
    }
  })

  movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  return { latestMonth, priorMonth, movers }
}

/** Stable-ish palette; categories are coloured by their rank. */
export const BUDGET_PALETTE = [
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#a78bfa',
  '#f472b6',
  '#84cc16',
  '#fb7185',
  '#38bdf8',
  '#facc15',
]

export function colorForIndex(i: number): string {
  return BUDGET_PALETTE[i % BUDGET_PALETTE.length]
}
