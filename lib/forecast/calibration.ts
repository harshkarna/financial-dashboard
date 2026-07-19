/**
 * Calibration — derive a seeded CalibrationProfile from the app's live data.
 *
 * What is auto-derived (with a visible "source" chip):
 *   • Starting balances per asset class  ← latest Net Worth month (item-level)
 *   • Tax outstanding                     ← latest Net Worth liabilities
 *   • Expense baseline                    ← median of trailing 12m expenditure (Earnings)
 *   • Pluralsight monthly income          ← trailing 12m course income (Other Income)
 *
 * What is a *manual, editable* assumption (not present in any sheet):
 *   • Salary split into base / bonus / RSU (defaults 47L / 7L / 12L)
 *   • Increment / return / inflation rates (scenario presets supply these)
 *
 * All classification is by item-name pattern so it is robust to the sheet's
 * exact `type` labels. Nothing here invents balance-sheet figures — the
 * starting values reconstruct the real latest net worth.
 */

import { MonthData, parseMonth } from '@/lib/netWorth'
import {
  ASSET_CLASS_LABELS,
  ASSET_CLASS_ORDER,
  AssetAssumption,
  AssetClassId,
  CalibrationProfile,
  ForecastAssumptions,
} from './types'

// ---------------------------------------------------------------------------
// Raw data shapes we consume (subset of each API payload)
// ---------------------------------------------------------------------------

export interface EarningsRecord {
  month: string
  year: number
  income: number
  expenditure: number
  saving: number
  invest: number
}

export interface OtherIncomeEntry {
  invoiceDate: string
  actual: number
  estimate: number
  category: 'course' | 'royalty' | 'miscellaneous' | string
}

export interface OtherIncomePayload {
  summary?: { avgCourseEarning?: number }
  monthlyTrend?: { month: string; amount: number }[]
  taxes?: { effectiveTaxRate?: number }
  courseInsights?: { coursesThisYear?: number; coursesLastYear?: number }
  /** All detail rows (used to compute trailing course/royalty income). */
  entries?: OtherIncomeEntry[]
}

export interface CalibrationInput {
  /** Net Worth months, most-recent-first (as /api/comparison returns). */
  months: MonthData[]
  earnings: EarningsRecord[]
  otherIncome: OtherIncomePayload | null
}

// ---------------------------------------------------------------------------
// Defaults for values that live nowhere in the sheets
// ---------------------------------------------------------------------------

const DEFAULT_ANNUAL_BASE = 5_000_000
const DEFAULT_ANNUAL_BONUS = 700_000
const DEFAULT_ANNUAL_RSU = 1_200_000
const DEFAULT_MONTHLY_PF = 25_000
const DEFAULT_SALARY_TAX_PCT = 30
const DEFAULT_PLURALSIGHT_TAX_PCT = 25

/** Default contribution split across investable classes (sums to 100). */
const DEFAULT_ALLOCATION: Partial<Record<AssetClassId, number>> = {
  mutualFunds: 50,
  stocks: 30,
  gold: 5,
  cash: 15,
}

// ---------------------------------------------------------------------------
// Asset classification
// ---------------------------------------------------------------------------

/** Map a Net Worth item name to a forecast asset class. */
export function classifyAsset(item: string, type: string): AssetClassId {
  const s = `${item} ${type}`.toLowerCase()
  if (/mutual\s*fund/.test(s)) return 'mutualFunds'
  if (/stock|equity share|shares?\b/.test(s)) return 'stocks'
  if (/rsu|espp|restricted stock/.test(s)) return 'rsu'
  if (/\bppf\b|provident|\bpf\b|epf/.test(s)) return 'pf'
  if (/real estate|property|land|flat|apartment|\bhome\b|house|plot/.test(s)) return 'realEstate'
  if (/gold|silver|metal/.test(s)) return 'gold'
  if (/crypto|bitcoin|\beth\b|coin/.test(s)) return 'crypto'
  if (/vehicle|\bcar\b|bike|motor/.test(s)) return 'vehicle'
  if (/saving|bank|cash|liquid|\bfd\b|deposit|wallet/.test(s)) return 'cash'
  return 'other'
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Chronological sort helper for records carrying month/year. */
function chronoKey(month: string, year: number): number {
  const parsed = parseMonth(month) ?? parseMonth(`${month} ${year}`)
  const m = parsed?.month ?? 1
  const y = parsed?.year ?? year
  return y * 12 + m
}

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

/** Median monthly expenditure over the trailing 12 recorded months. */
export function deriveExpenseBaseline(earnings: EarningsRecord[]): { value: number; source: string } {
  const withExpense = earnings.filter((e) => e.expenditure > 0)
  if (withExpense.length === 0) return { value: 80_000, source: 'Default (no expense history)' }
  const sorted = [...withExpense].sort((a, b) => chronoKey(a.month, a.year) - chronoKey(b.month, b.year))
  const last12 = sorted.slice(-12)
  return {
    value: Math.round(median(last12.map((e) => e.expenditure))),
    source: `Median of trailing ${last12.length}m expenditure`,
  }
}

/** Parse an "M/D/YYYY" invoice date into a millisecond timestamp (or null). */
function parseInvoiceDate(dateStr: string): number | null {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length < 3) return null
  const month = parseInt(parts[0], 10) - 1
  const day = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  if ([month, day, year].some((n) => Number.isNaN(n))) return null
  return new Date(year, month, day).getTime()
}

/**
 * Trailing 12-month average monthly Pluralsight income.
 *
 * Uses only course + royalty rows (excludes unrelated miscellaneous income) and
 * spreads the last 12 months of actual invoices into a monthly rate — which is
 * what the monthly engine needs. Values are GROSS; the engine applies tax.
 */
export function derivePluralsight(other: OtherIncomePayload | null): {
  monthly: number
  taxPct: number
  source: string
} {
  const taxPct = other?.taxes?.effectiveTaxRate && other.taxes.effectiveTaxRate > 0
    ? Math.round(other.taxes.effectiveTaxRate)
    : DEFAULT_PLURALSIGHT_TAX_PCT

  // Preferred: real course/royalty invoices over the trailing 12 months.
  const entries = (other?.entries ?? []).filter(
    (e) => e.category === 'course' || e.category === 'royalty',
  )
  const dated = entries
    .map((e) => ({ ts: parseInvoiceDate(e.invoiceDate), amount: e.actual || e.estimate || 0 }))
    .filter((e): e is { ts: number; amount: number } => e.ts !== null)

  if (dated.length > 0) {
    const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000
    const trailing = dated.filter((e) => e.ts >= cutoff)
    if (trailing.length > 0) {
      const total = trailing.reduce((s, e) => s + e.amount, 0)
      return {
        monthly: Math.round(total / 12),
        taxPct,
        source: `Trailing 12m courses (${trailing.length} invoices) ÷ 12`,
      }
    }
    // No invoices in the last year → spread all-time course income across its span.
    const timestamps = dated.map((e) => e.ts)
    const spanMonths = Math.max(1, (Math.max(...timestamps) - Math.min(...timestamps)) / (30.44 * 24 * 60 * 60 * 1000))
    const total = dated.reduce((s, e) => s + e.amount, 0)
    return {
      monthly: Math.round(total / spanMonths),
      taxPct,
      source: `Course income ÷ ${Math.round(spanMonths)}m history`,
    }
  }

  // Fallback: average course earning × courses/year ÷ 12.
  const avg = other?.summary?.avgCourseEarning ?? 0
  const perYear = other?.courseInsights?.coursesThisYear || other?.courseInsights?.coursesLastYear || 0
  if (avg > 0 && perYear > 0) {
    return {
      monthly: Math.round((avg * perYear) / 12),
      taxPct,
      source: `Avg course × ${perYear}/yr ÷ 12`,
    }
  }
  return { monthly: 0, taxPct, source: 'No course history — set manually' }
}

/** Build starting asset balances by classifying the latest month's items. */
export function deriveStartingAssets(latest: MonthData): {
  byClass: Record<AssetClassId, number>
  source: string
} {
  const byClass = {} as Record<AssetClassId, number>
  for (const id of ASSET_CLASS_ORDER) byClass[id] = 0
  for (const asset of latest.assets) {
    if (!asset.amount) continue
    byClass[classifyAsset(asset.item, asset.type)] += asset.amount
  }
  return { byClass, source: `Latest month (${latest.month})` }
}

/** Outstanding income-tax provision from the latest month's liabilities. */
export function deriveTaxOutstanding(latest: MonthData): { value: number; source: string } {
  const tax = latest.liabilities
    .filter((l) => /tax/i.test(l.item))
    .reduce((s, l) => s + l.amount, 0)
  return { value: tax, source: tax > 0 ? `Latest month (${latest.month})` : 'No outstanding tax' }
}

/**
 * Build the neutral CalibrationProfile (a "base" assumption set). Scenario
 * presets later layer their return tables / growth knobs on top.
 */
export function calibrate(input: CalibrationInput): CalibrationProfile {
  const latest = input.months[0]
  const startDateParsed = parseMonth(latest.month) ?? { month: new Date().getMonth() + 1, year: new Date().getFullYear() }

  const startingAssets = deriveStartingAssets(latest)
  const taxOutstanding = deriveTaxOutstanding(latest)
  const expense = deriveExpenseBaseline(input.earnings)
  const pl = derivePluralsight(input.otherIncome)

  const assets: AssetAssumption[] = ASSET_CLASS_ORDER.map((id) => ({
    id,
    label: ASSET_CLASS_LABELS[id],
    startingValue: startingAssets.byClass[id],
    // Neutral placeholder; scenario presets overwrite this per class.
    annualReturnPct: 0,
    contributionPct: DEFAULT_ALLOCATION[id] ?? 0,
    investable: id !== 'vehicle' && id !== 'realEstate',
  }))

  const assumptions: ForecastAssumptions = {
    employment: {
      annualBase: DEFAULT_ANNUAL_BASE,
      annualBonus: DEFAULT_ANNUAL_BONUS,
      annualRsuVesting: DEFAULT_ANNUAL_RSU,
      monthlyPfContribution: DEFAULT_MONTHLY_PF,
      annualIncrementPct: 8,
      rsuGrowthPct: 8,
      effectiveTaxPct: DEFAULT_SALARY_TAX_PCT,
    },
    pluralsight: {
      monthlyIncome: pl.monthly,
      annualGrowthPct: -5,
      effectiveTaxPct: pl.taxPct,
    },
    otherIncome: {
      monthlyIncome: 0,
      annualGrowthPct: 0,
      effectiveTaxPct: 20,
    },
    expenses: {
      monthlyBaseline: expense.value,
      annualInflationPct: 6,
    },
    assets,
    liabilities: {
      taxOutstanding: taxOutstanding.value,
      taxPaymentMonthOffset: 2,
      loanBalance: 0,
      loanAnnualRatePct: 9,
      loanMonthlyPayment: 0,
    },
    investShareOfSurplusPct: 85,
    events: [],
    fi: {
      // Retire on today's spend, grown by inflation, at a 3.5% safe withdrawal.
      annualSpendToday: Math.round(expense.value * 12),
      swrPct: 3.5,
      inflationPct: 6,
      passiveAnnualIncome: 0,
      // Home + vehicle are illiquid — excluded from the FI corpus by default.
      includeHomeAndVehicle: false,
    },
  }

  const startNetWorth = latest.netWorth

  return {
    startDate: { month: startDateParsed.month, year: startDateParsed.year },
    startNetWorth,
    assumptions,
    sources: {
      expenses: expense.source,
      pluralsight: pl.source,
      employment: 'Manual assumption (not in sheets)',
      startingValues: startingAssets.source,
      taxOutstanding: taxOutstanding.source,
    },
  }
}
