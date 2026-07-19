/**
 * Forecast engine — a transparent, deterministic monthly projection.
 *
 * The engine is a pure function of (assumptions, start date, months). It runs
 * MONTHLY internally even when the UI shows annual summaries.
 *
 * CALCULATION ORDER (documented — changing it changes results):
 *   For every future month:
 *     1. Carry previous month's asset & liability balances.
 *     1a. Apply any PURCHASE events due this month (add asset, spend cash,
 *         open a loan) — a NW-neutral swap when price = down + loan.
 *     2. Compute income (salary + bonus + RSU, Pluralsight, other) with growth,
 *        after applying JOB-SWITCH and PLURALSIGHT-CHANGE events.
 *     3. Apply taxes / deductions via effective rates.
 *     4. Compute recurring expenses (inflated + EXPENSE/JOB-SWITCH deltas).
 *     5. Compute loan interest (expense) and principal (balance-sheet transfer).
 *     6. netFlow = afterTaxIncome + PF + one-off CASHFLOW − expenses − interest.
 *     7. Route PF contribution to PF; split the remaining surplus into
 *        investments (per allocation) and cash.
 *     8. Settle scheduled balance-sheet transfers (tax provision, loan
 *        principal) — net-worth-neutral at the moment they happen.
 *     9. Apply asset growth / depreciation: monthlyReturn = (1+r)^(1/12) − 1.
 *    10. Recompute totals and net worth = assets − liabilities.
 *    11. Attribute the month's net-worth change: everything not explained by
 *        market growth/depreciation is a "contribution".
 *
 * RECONCILIATION IDENTITY (asserted by tests, holds by construction):
 *   endingNetWorth = startNetWorth
 *                    + cumulativeContributions   (Σ non-market ΔNW)
 *                    + cumulativeReturns          (Σ positive growth)
 *                    − cumulativeDepreciation     (Σ |negative growth|)
 *   Because contributions are DEFINED as ΔNW − marketGrowth each month, the
 *   identity holds for any mix of events; balance-sheet transfers net to zero.
 */

import {
  AnnualForecastSummary,
  AssetClassId,
  ASSET_CLASS_ORDER,
  ForecastAssumptions,
  ForecastResult,
  MilestoneResult,
  MonthlyForecastPoint,
  ScenarioEvent,
} from './types'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Milestones tracked on the forecast (rupees). */
export const FORECAST_MILESTONES: { value: number; label: string }[] = [
  { value: 20_000_000, label: '₹2 Cr' },
  { value: 30_000_000, label: '₹3 Cr' },
  { value: 50_000_000, label: '₹5 Cr' },
  { value: 100_000_000, label: '₹10 Cr' },
]

/** Add `delta` whole months to a {month(1-12), year}. */
export function addMonths(
  start: { month: number; year: number },
  delta: number,
): { month: number; year: number; label: string } {
  const zeroBased = start.month - 1 + delta
  const year = start.year + Math.floor(zeroBased / 12)
  const month = ((zeroBased % 12) + 12) % 12
  return { month: month + 1, year, label: `${MONTH_NAMES[month]} ${year}` }
}

/** Convert an annual return (%) to its equivalent monthly compounding rate. */
export function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1
}

function emptyByAsset(): Record<AssetClassId, number> {
  const rec = {} as Record<AssetClassId, number>
  for (const id of ASSET_CLASS_ORDER) rec[id] = 0
  return rec
}

export interface RunForecastInput {
  assumptions: ForecastAssumptions
  startDate: { month: number; year: number }
  months: number
}

/** Employment / expense modifiers accumulated from events active by month `i`. */
interface MonthModifiers {
  /** Multiplicative factor on base + bonus (compounded job-switch hikes). */
  salaryFactor: number
  /** Absolute annual RSU override from the latest job switch, or null. */
  rsuOverride: number | null
  /** Multiplicative factor on the expense baseline. */
  expenseFactor: number
  /** True while a career-break gap zeroes salary this month. */
  salaryGap: boolean
  /** One-time gross joining bonus paid this exact month (taxed as salary). */
  joiningBonus: number
}

/** Derive the active employment/expense modifiers for forecast month `i`. */
function modifiersForMonth(events: ScenarioEvent[], i: number): MonthModifiers {
  let salaryFactor = 1
  let rsuOverride: number | null = null
  let expenseFactor = 1
  let salaryGap = false
  let joiningBonus = 0

  const jobSwitches = events
    .filter((e) => e.type === 'jobSwitch' && e.enabled)
    .sort((a, b) => a.monthOffset - b.monthOffset)

  for (const e of jobSwitches) {
    if (e.type !== 'jobSwitch') continue
    if (i < e.monthOffset) continue
    salaryFactor *= 1 + e.salaryHikePct / 100
    if (e.newAnnualRsu !== null) rsuOverride = e.newAnnualRsu
    if (e.expenseChangePct) expenseFactor *= 1 + e.expenseChangePct / 100
    if (i === e.monthOffset) joiningBonus += Math.max(0, e.joiningBonus)
    if (e.monthsWithoutSalary > 0 && i < e.monthOffset + e.monthsWithoutSalary) {
      salaryGap = true
    }
  }

  for (const e of events) {
    if (e.type === 'expenseChange' && e.enabled && i >= e.monthOffset) {
      expenseFactor *= 1 + e.changePct / 100
    }
  }

  return { salaryFactor, rsuOverride, expenseFactor, salaryGap, joiningBonus }
}

/** Apply Pluralsight-change events to a base monthly value for month `i`. */
function applyPluralsightEvents(events: ScenarioEvent[], i: number, base: number): number {
  const changes = events
    .filter((e) => e.type === 'pluralsightChange' && e.enabled)
    .sort((a, b) => a.monthOffset - b.monthOffset)
  let value = base
  for (const e of changes) {
    if (e.type !== 'pluralsightChange') continue
    const active = i >= e.monthOffset && (e.durationMonths <= 0 || i < e.monthOffset + e.durationMonths)
    if (!active) continue
    if (e.action === 'shutdown') value = 0
    else if (e.action === 'setMonthly') value = Math.max(0, e.value)
    else if (e.action === 'multiply') value *= e.value
  }
  return Math.max(0, value)
}

/**
 * Run the deterministic forecast.
 * @param months number of future months to project (e.g. 12 * years)
 */
export function runForecast(input: RunForecastInput): ForecastResult {
  const { assumptions: a, startDate, months } = input
  const monthsCount = Math.max(0, Math.floor(months))

  // Balances (mutable through the loop).
  const balances = emptyByAsset()
  for (const asset of a.assets) balances[asset.id] = asset.startingValue

  let taxOutstanding = Math.max(0, a.liabilities.taxOutstanding)
  let loanBalance = Math.max(0, a.liabilities.loanBalance)

  const startAssets = ASSET_CLASS_ORDER.reduce((s, id) => s + balances[id], 0)
  const startNetWorth = startAssets - taxOutstanding - loanBalance

  // Investable allocation weights (normalised so they sum to 1).
  const investable = a.assets.filter((x) => x.investable && x.contributionPct > 0)
  const totalPct = investable.reduce((s, x) => s + x.contributionPct, 0)

  let loanPayment = Math.max(0, a.liabilities.loanMonthlyPayment)
  let loanMonthlyRate = a.liabilities.loanAnnualRatePct / 100 / 12

  const events = a.events ?? []

  let cumC = 0
  let cumR = 0
  let cumD = 0
  let prevNetWorth = startNetWorth

  const monthly: MonthlyForecastPoint[] = []

  for (let i = 0; i < monthsCount; i++) {
    const when = addMonths(startDate, i + 1)
    const yearIdx = Math.floor(i / 12)

    // (1a) Purchase events due this month: add the asset, spend the cash, open
    //      any loan. NW-neutral when price = downPayment + loanAmount.
    for (const e of events) {
      if (e.type !== 'purchase' || !e.enabled || e.monthOffset !== i) continue
      balances[e.assetClass] += Math.max(0, e.price)
      balances.cash -= Math.max(0, e.downPayment)
      if (e.loanAmount > 0) {
        loanBalance += e.loanAmount
        loanPayment += Math.max(0, e.loanMonthlyPayment)
        loanMonthlyRate = Math.max(loanMonthlyRate, e.loanRatePct / 100 / 12)
      }
    }

    const mods = modifiersForMonth(events, i)

    // (2) Income with annual growth, compounding per elapsed forecast year.
    const incFactor = Math.pow(1 + a.employment.annualIncrementPct / 100, yearIdx)
    const rsuFactor = Math.pow(1 + a.employment.rsuGrowthPct / 100, yearIdx)
    const rsuAnnual = mods.rsuOverride !== null ? mods.rsuOverride : a.employment.annualRsuVesting
    let baseM = (a.employment.annualBase * incFactor * mods.salaryFactor) / 12
    let bonusM = (a.employment.annualBonus * incFactor * mods.salaryFactor) / 12
    let rsuM = (rsuAnnual * rsuFactor) / 12
    if (mods.salaryGap) {
      baseM = 0
      bonusM = 0
      rsuM = 0
    }
    const salaryGross = baseM + bonusM + rsuM + mods.joiningBonus

    const plFactor = Math.pow(1 + a.pluralsight.annualGrowthPct / 100, yearIdx)
    const plGross = applyPluralsightEvents(events, i, Math.max(0, a.pluralsight.monthlyIncome * plFactor))

    const otherFactor = Math.pow(1 + a.otherIncome.annualGrowthPct / 100, yearIdx)
    const otherGross = Math.max(0, a.otherIncome.monthlyIncome * otherFactor)

    // (3) Taxes.
    const salaryTax = salaryGross * (a.employment.effectiveTaxPct / 100)
    const plTax = plGross * (a.pluralsight.effectiveTaxPct / 100)
    const otherTax = otherGross * (a.otherIncome.effectiveTaxPct / 100)
    const taxes = salaryTax + plTax + otherTax

    const salaryNet = salaryGross - salaryTax
    const plNet = plGross - plTax
    const otherNet = otherGross - otherTax
    const grossIncome = salaryGross + plGross + otherGross
    const afterTaxIncome = salaryNet + plNet + otherNet

    // (4) Expenses (inflated per elapsed year, plus event deltas).
    const expenses =
      a.expenses.monthlyBaseline *
      Math.pow(1 + a.expenses.annualInflationPct / 100, yearIdx) *
      mods.expenseFactor

    // (5) Loan interest (expense) + principal (transfer).
    const interest = loanBalance * loanMonthlyRate
    const principal = Math.min(loanBalance, Math.max(0, loanPayment - interest))

    // (6) Net inflow to the asset side (incl. one-off cash flows this month).
    const pf = a.employment.monthlyPfContribution
    let oneOff = 0
    for (const e of events) {
      if (e.type === 'cashflow' && e.enabled && e.monthOffset === i) oneOff += e.amount
    }
    const netFlow = afterTaxIncome + pf - expenses - interest + oneOff

    // (7) Route contributions.
    balances.pf += pf
    const remaining = netFlow - pf
    let invested = 0
    if (remaining >= 0) {
      invested = remaining * (a.investShareOfSurplusPct / 100)
      const toCash = remaining - invested
      balances.cash += toCash
      if (totalPct > 0) {
        for (const asset of investable) {
          balances[asset.id] += invested * (asset.contributionPct / totalPct)
        }
      } else {
        balances.cash += invested
      }
    } else {
      // Overspend: draw down cash.
      balances.cash += remaining
    }
    const investibleSurplus = remaining

    // (8) Balance-sheet transfers (net-worth-neutral).
    if (i === a.liabilities.taxPaymentMonthOffset && taxOutstanding > 0) {
      balances.cash -= taxOutstanding
      taxOutstanding = 0
    }
    if (principal > 0) {
      balances.cash -= principal
      loanBalance -= principal
    }

    // (9) Growth / depreciation.
    let growthPos = 0
    let growthNeg = 0
    for (const asset of a.assets) {
      const r = monthlyRate(asset.annualReturnPct)
      const g = balances[asset.id] * r
      balances[asset.id] += g
      if (g >= 0) growthPos += g
      else growthNeg += -g
    }

    // (10) Totals.
    const totalAssets = ASSET_CLASS_ORDER.reduce((s, id) => s + balances[id], 0)
    const totalLiabilities = taxOutstanding + loanBalance
    const netWorth = totalAssets - totalLiabilities

    // (11) Attribution — contributions are the month's ΔNW not explained by
    //      market growth. This makes the reconciliation identity hold for any
    //      mix of events (purchases, cash flows, etc.).
    cumC += netWorth - prevNetWorth - (growthPos - growthNeg)
    cumR += growthPos
    cumD += growthNeg
    prevNetWorth = netWorth

    monthly.push({
      index: i,
      date: when.label,
      month: when.month,
      year: when.year,
      kind: 'forecast',
      grossIncome,
      afterTaxIncome,
      salaryIncome: salaryNet,
      pluralsightIncome: plNet,
      otherIncome: otherNet,
      expenses,
      taxes,
      debtInterest: interest,
      investibleSurplus,
      valueByAsset: { ...balances },
      totalAssets,
      totalLiabilities,
      netWorth,
      cumulativeContributions: cumC,
      cumulativeReturns: cumR,
      cumulativeDepreciation: cumD,
    })
  }

  const endingNetWorth = monthly.length ? monthly[monthly.length - 1].netWorth : startNetWorth
  const reconciled = startNetWorth + cumC + cumR - cumD
  const reconciles = Math.abs(reconciled - endingNetWorth) < 1

  return {
    startDate: `${MONTH_NAMES[startDate.month - 1]} ${startDate.year}`,
    startNetWorth,
    monthly,
    annual: summariseAnnual(monthly, startNetWorth),
    milestones: computeMilestones(monthly),
    endingNetWorth,
    totalContributions: cumC,
    totalReturns: cumR,
    totalDepreciation: cumD,
    reconciles,
  }
}

/** Group monthly points into calendar-year summaries. */
function summariseAnnual(monthly: MonthlyForecastPoint[], startNetWorth: number): AnnualForecastSummary[] {
  if (monthly.length === 0) return []
  const byYear = new Map<number, MonthlyForecastPoint[]>()
  for (const p of monthly) {
    if (!byYear.has(p.year)) byYear.set(p.year, [])
    byYear.get(p.year)!.push(p)
  }

  const summaries: AnnualForecastSummary[] = []
  let prevEnding = startNetWorth
  let prevCumC = 0
  let prevCumR = 0
  let prevCumD = 0

  const years = Array.from(byYear.keys()).sort((x, y) => x - y)
  for (const year of years) {
    const pts = byYear.get(year)!
    const last = pts[pts.length - 1]
    const sum = (sel: (p: MonthlyForecastPoint) => number) => pts.reduce((s, p) => s + sel(p), 0)

    const startingNetWorth = prevEnding
    const endingNetWorth = last.netWorth
    const summary: AnnualForecastSummary = {
      year,
      startingNetWorth,
      salaryIncome: sum((p) => p.salaryIncome),
      pluralsightIncome: sum((p) => p.pluralsightIncome),
      otherIncome: sum((p) => p.otherIncome),
      expenses: sum((p) => p.expenses),
      taxes: sum((p) => p.taxes),
      // Attribution flows are cumulative on each point → take the year's delta.
      contributions: last.cumulativeContributions - prevCumC,
      investmentGrowth: last.cumulativeReturns - prevCumR,
      depreciation: last.cumulativeDepreciation - prevCumD,
      endingLiabilities: last.totalLiabilities,
      endingNetWorth,
      yoyGrowthPct: startingNetWorth !== 0 ? ((endingNetWorth - startingNetWorth) / Math.abs(startingNetWorth)) * 100 : null,
      months: pts,
    }
    summaries.push(summary)
    prevEnding = endingNetWorth
    prevCumC = last.cumulativeContributions
    prevCumR = last.cumulativeReturns
    prevCumD = last.cumulativeDepreciation
  }
  return summaries
}

/** First forecast month at which each milestone is reached. */
function computeMilestones(monthly: MonthlyForecastPoint[]): MilestoneResult[] {
  return FORECAST_MILESTONES.map((m) => {
    const idx = monthly.findIndex((p) => p.netWorth >= m.value)
    if (idx === -1) {
      return { value: m.value, label: m.label, achieved: false, date: null, monthsAway: null }
    }
    return {
      value: m.value,
      label: m.label,
      achieved: true,
      date: monthly[idx].date,
      monthsAway: idx + 1,
    }
  })
}
