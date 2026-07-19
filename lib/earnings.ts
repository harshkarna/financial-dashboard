/**
 * Shared types and helpers for the Earnings experience.
 * Centralised so the breakdown, charts, and insights all agree on
 * ordering, labelling, and which months count as "complete".
 */

export interface EarningRecord {
  month: string // raw label from the sheet, e.g. "Aug/21"
  monthName: string // "Aug"
  year: number // 2021
  income: number
  expenditure: number
  saving: number
  invest: number
  savingPercent: number
  investPercent: number
}

export const MONTH_ORDER = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function monthIndex(name: string): number {
  const i = MONTH_ORDER.indexOf((name || '').trim())
  return i >= 0 ? i : -1
}

/** Chronological order (oldest → newest). */
export function sortChrono(records: EarningRecord[]): EarningRecord[] {
  return [...records].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : monthIndex(a.monthName) - monthIndex(b.monthName),
  )
}

/**
 * Drop future months and the current (still-incomplete) month so
 * trends and insights only reflect fully-logged periods.
 */
export function completeRecords(records: EarningRecord[]): EarningRecord[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return sortChrono(records).filter((r) => {
    if (r.year > y) return false
    if (r.year === y && monthIndex(r.monthName) > m) return false
    return true
  })
}

/** Highest month index present for a given year (−1 if none). */
export function maxMonthIndexForYear(year: number, records: EarningRecord[]): number {
  let max = -1
  for (const r of records) {
    if (r.year !== year) continue
    const idx = monthIndex(r.monthName)
    if (idx > max) max = idx
  }
  return max
}

/** X-axis label: bare month when scoped to one year, else "Aug '21". */
export function chartLabel(r: { monthName: string; year: number }, showYear: boolean): string {
  return showYear ? `${r.monthName} '${String(r.year).slice(2)}` : r.monthName
}
