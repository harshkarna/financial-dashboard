/** Shared time-range definitions for the Net Worth page.
 * Data is monthly, so ranges are expressed in months (no daily/weekly). */

export type RangeKey = '3M' | '6M' | '1Y' | 'ALL'

export const RANGES: { key: RangeKey; label: string; months: number | null }[] = [
  { key: '3M', label: '3M', months: 3 },
  { key: '6M', label: '6M', months: 6 },
  { key: '1Y', label: '1Y', months: 12 },
  { key: 'ALL', label: 'All', months: null },
]

export function rangeLabel(key: RangeKey): string {
  switch (key) {
    case '3M':
      return '3 months'
    case '6M':
      return '6 months'
    case '1Y':
      return '1 year'
    case 'ALL':
      return 'All time'
  }
}
