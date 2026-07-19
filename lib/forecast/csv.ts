/**
 * CSV export for the forecast tables. Kept dependency-free; values are raw
 * rupees (no formatting) so the file is easy to re-analyse in a spreadsheet.
 */

import { AnnualForecastSummary } from './types'

function escape(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
}

export function buildAnnualCsv(annual: AnnualForecastSummary[]): string {
  const headers = [
    'Year', 'Start NW', 'Salary', 'Pluralsight', 'Other', 'Expenses', 'Taxes',
    'Contributions', 'Investment growth', 'Depreciation', 'End liabilities', 'End NW', 'YoY %',
  ]
  const rows = annual.map((a) => [
    a.year,
    Math.round(a.startingNetWorth),
    Math.round(a.salaryIncome),
    Math.round(a.pluralsightIncome),
    Math.round(a.otherIncome),
    Math.round(a.expenses),
    Math.round(a.taxes),
    Math.round(a.contributions),
    Math.round(a.investmentGrowth),
    Math.round(a.depreciation),
    Math.round(a.endingLiabilities),
    Math.round(a.endingNetWorth),
    a.yoyGrowthPct === null ? '' : a.yoyGrowthPct.toFixed(2),
  ])
  return toCsv(headers, rows)
}

export function buildMonthlyCsv(annual: AnnualForecastSummary[]): string {
  const headers = [
    'Month', 'Gross income', 'After-tax income', 'Salary', 'Pluralsight', 'Other',
    'Expenses', 'Taxes', 'Surplus', 'Total assets', 'Total liabilities', 'Net worth',
  ]
  const rows = annual.flatMap((a) =>
    a.months.map((m) => [
      m.date,
      Math.round(m.grossIncome),
      Math.round(m.afterTaxIncome),
      Math.round(m.salaryIncome),
      Math.round(m.pluralsightIncome),
      Math.round(m.otherIncome),
      Math.round(m.expenses),
      Math.round(m.taxes),
      Math.round(m.investibleSurplus),
      Math.round(m.totalAssets),
      Math.round(m.totalLiabilities),
      Math.round(m.netWorth),
    ]),
  )
  return toCsv(headers, rows)
}

/** Trigger a client-side download of a CSV string. */
export function downloadCsv(filename: string, content: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
