/**
 * Financial Independence (retirement) maths.
 *
 * FI is reached when your qualifying net worth can fund your (inflation-grown)
 * annual spend indefinitely at a Safe Withdrawal Rate:
 *
 *   requiredCorpus(t) = max(0, annualSpend(t) − passiveIncome(t)) / SWR
 *
 * where annualSpend and passiveIncome are grown by inflation to year `t`. We
 * scan the monthly forecast for the first month whose qualifying net worth
 * clears that (moving) target. "Qualifying" net worth optionally excludes the
 * home and vehicle, since you generally can't spend those down to live.
 */

import { FIAssumptions, FIResult, ForecastResult } from './types'

export function computeFI(result: ForecastResult, fi: FIAssumptions): FIResult {
  const swr = fi.swrPct / 100
  const startNetWorth = result.startNetWorth

  const annualNetToday = Math.max(0, fi.annualSpendToday - fi.passiveAnnualIncome)
  const requiredCorpusToday = swr > 0 ? annualNetToday / swr : Infinity
  const safeMonthlyIncomeNow = (startNetWorth * swr) / 12
  const gapToday = requiredCorpusToday - startNetWorth

  const qualifying = (point: ForecastResult['monthly'][number]): number => {
    if (fi.includeHomeAndVehicle) return point.netWorth
    return point.netWorth - point.valueByAsset.realEstate - point.valueByAsset.vehicle
  }

  const requiredAt = (monthsFromStart: number): number => {
    if (swr <= 0) return Infinity
    const years = monthsFromStart / 12
    const inflation = Math.pow(1 + fi.inflationPct / 100, years)
    const spend = fi.annualSpendToday * inflation
    const passive = fi.passiveAnnualIncome * inflation
    return Math.max(0, spend - passive) / swr
  }

  let achieved = false
  let date: string | null = null
  let monthsAway: number | null = null
  let requiredCorpusAtFI = requiredCorpusToday
  let netWorthAtFI: number | null = null

  for (let idx = 0; idx < result.monthly.length; idx++) {
    const point = result.monthly[idx]
    const required = requiredAt(idx + 1)
    if (qualifying(point) >= required) {
      achieved = true
      date = point.date
      monthsAway = idx + 1
      requiredCorpusAtFI = required
      netWorthAtFI = qualifying(point)
      break
    }
  }

  return {
    requiredCorpusToday,
    safeMonthlyIncomeNow,
    achieved,
    date,
    monthsAway,
    requiredCorpusAtFI,
    netWorthAtFI,
    gapToday,
  }
}
