'use client'

import { useState } from 'react'
import { ChevronRight, Table as TableIcon, Download } from 'lucide-react'
import { formatCompactINR, formatSignedPercent } from '@/lib/format'
import { AnnualForecastSummary, MonthlyForecastPoint } from '@/lib/forecast/types'
import { buildAnnualCsv, buildMonthlyCsv, downloadCsv } from '@/lib/forecast/csv'

interface AnnualTableProps {
  annual: AnnualForecastSummary[]
  scenarioName?: string
}

const COLS = [
  { key: 'startingNetWorth', label: 'Start NW' },
  { key: 'salaryIncome', label: 'Salary' },
  { key: 'pluralsightIncome', label: 'Pluralsight' },
  { key: 'otherIncome', label: 'Other' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'taxes', label: 'Taxes' },
  { key: 'contributions', label: 'Contrib.' },
  { key: 'investmentGrowth', label: 'Growth' },
  { key: 'endingLiabilities', label: 'Liabilities' },
  { key: 'endingNetWorth', label: 'End NW' },
] as const

export function AnnualTable({ annual, scenarioName = 'forecast' }: AnnualTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const slug = scenarioName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'forecast'
  const exportCsv = (kind: 'annual' | 'monthly') => {
    const content = kind === 'annual' ? buildAnnualCsv(annual) : buildMonthlyCsv(annual)
    downloadCsv(`${slug}-${kind}.csv`, content)
  }

  return (
    <section className="nw-card p-5" aria-label="Annual projection">
      <div className="flex items-center gap-2.5 mb-4">
        <TableIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-base font-semibold nw-text-primary">Annual Projection</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => exportCsv('annual')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium nw-control"
            title="Download annual rows as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Annual CSV
          </button>
          <button
            onClick={() => exportCsv('monthly')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium nw-control"
            title="Download month-by-month rows as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Monthly CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2 custom-scrollbar">
        <table className="w-full text-sm border-collapse min-w-[720px]">
          <thead>
            <tr className="text-xs nw-text-muted text-right">
              <th className="text-left font-medium py-2 pr-3">Year</th>
              {COLS.map((c) => (
                <th key={c.key} className="font-medium py-2 px-2">{c.label}</th>
              ))}
              <th className="font-medium py-2 pl-2">YoY</th>
            </tr>
          </thead>
          <tbody>
            {annual.map((row) => {
              const isOpen = expanded === row.year
              return (
                <FragmentRow
                  key={row.year}
                  row={row}
                  isOpen={isOpen}
                  onToggle={() => setExpanded(isOpen ? null : row.year)}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FragmentRow({
  row,
  isOpen,
  onToggle,
}: {
  row: AnnualForecastSummary
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="border-t nw-hairline text-right tabnums cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
        onClick={onToggle}
      >
        <td className="text-left py-2 pr-3">
          <span className="inline-flex items-center gap-1 nw-text-primary font-medium">
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            {row.year}
          </span>
        </td>
        <td className="py-2 px-2 nw-text-secondary">{formatCompactINR(row.startingNetWorth)}</td>
        <td className="py-2 px-2 nw-text-secondary">{formatCompactINR(row.salaryIncome)}</td>
        <td className="py-2 px-2 nw-text-secondary">{formatCompactINR(row.pluralsightIncome)}</td>
        <td className="py-2 px-2 nw-text-secondary">{formatCompactINR(row.otherIncome)}</td>
        <td className="py-2 px-2 nw-loss">{formatCompactINR(row.expenses)}</td>
        <td className="py-2 px-2 nw-loss">{formatCompactINR(row.taxes)}</td>
        <td className="py-2 px-2 nw-text-secondary">{formatCompactINR(row.contributions)}</td>
        <td className="py-2 px-2 nw-gain">{formatCompactINR(row.investmentGrowth)}</td>
        <td className="py-2 px-2 nw-text-secondary">{formatCompactINR(row.endingLiabilities)}</td>
        <td className="py-2 px-2 nw-text-primary font-semibold">{formatCompactINR(row.endingNetWorth)}</td>
        <td className={`py-2 pl-2 ${(row.yoyGrowthPct ?? 0) >= 0 ? 'nw-gain' : 'nw-loss'}`}>
          {formatSignedPercent(row.yoyGrowthPct)}
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t nw-hairline">
          <td colSpan={COLS.length + 2} className="p-0">
            <div className="nw-inset m-2 p-3">
              <MonthlyDetail months={row.months} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function MonthlyDetail({ months }: { months: MonthlyForecastPoint[] }) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-xs border-collapse min-w-[560px]">
        <thead>
          <tr className="nw-text-muted text-right">
            <th className="text-left font-medium py-1 pr-3">Month</th>
            <th className="font-medium py-1 px-2">Income</th>
            <th className="font-medium py-1 px-2">Expenses</th>
            <th className="font-medium py-1 px-2">Surplus</th>
            <th className="font-medium py-1 px-2">Net Worth</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.date} className="text-right tabnums nw-text-secondary">
              <td className="text-left py-1 pr-3">{m.date}</td>
              <td className="py-1 px-2">{formatCompactINR(m.afterTaxIncome)}</td>
              <td className="py-1 px-2">{formatCompactINR(m.expenses)}</td>
              <td className={`py-1 px-2 ${m.investibleSurplus >= 0 ? 'nw-gain' : 'nw-loss'}`}>
                {formatCompactINR(m.investibleSurplus)}
              </td>
              <td className="py-1 px-2 nw-text-primary">{formatCompactINR(m.netWorth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
