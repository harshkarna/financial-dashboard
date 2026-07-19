import { describe, it, expect } from 'vitest'
import { runForecast, addMonths, monthlyRate, FORECAST_MILESTONES } from './engine'
import { calibrate, classifyAsset } from './calibration'
import { buildAssumptionsForPreset } from './scenarios'
import { computeFI } from './fi'
import {
  ASSET_CLASS_ORDER,
  AssetAssumption,
  AssetClassId,
  FIAssumptions,
  ForecastAssumptions,
  ScenarioEvent,
} from './types'
import { formatCompactINR } from '@/lib/format'
import { MonthData } from '@/lib/netWorth'

// ---------------------------------------------------------------------------
// Test fixture builders
// ---------------------------------------------------------------------------

function makeAssets(
  starting: Partial<Record<AssetClassId, number>>,
  returns: Partial<Record<AssetClassId, number>>,
): AssetAssumption[] {
  return ASSET_CLASS_ORDER.map((id) => ({
    id,
    label: id,
    startingValue: starting[id] ?? 0,
    annualReturnPct: returns[id] ?? 0,
    // All investable surplus goes to cash by default (keeps tests deterministic).
    contributionPct: id === 'cash' ? 100 : 0,
    investable: id !== 'vehicle' && id !== 'realEstate',
  }))
}

function makeAssumptions(overrides: {
  starting?: Partial<Record<AssetClassId, number>>
  returns?: Partial<Record<AssetClassId, number>>
  employment?: Partial<ForecastAssumptions['employment']>
  pluralsight?: Partial<ForecastAssumptions['pluralsight']>
  expenses?: Partial<ForecastAssumptions['expenses']>
  liabilities?: Partial<ForecastAssumptions['liabilities']>
  investShareOfSurplusPct?: number
  events?: ScenarioEvent[]
  fi?: Partial<FIAssumptions>
} = {}): ForecastAssumptions {
  return {
    employment: {
      annualBase: 0,
      annualBonus: 0,
      annualRsuVesting: 0,
      monthlyPfContribution: 0,
      annualIncrementPct: 0,
      rsuGrowthPct: 0,
      effectiveTaxPct: 0,
      ...overrides.employment,
    },
    pluralsight: { monthlyIncome: 0, annualGrowthPct: 0, effectiveTaxPct: 0, ...overrides.pluralsight },
    otherIncome: { monthlyIncome: 0, annualGrowthPct: 0, effectiveTaxPct: 0 },
    expenses: { monthlyBaseline: 0, annualInflationPct: 0, ...overrides.expenses },
    assets: makeAssets(overrides.starting ?? {}, overrides.returns ?? {}),
    liabilities: {
      taxOutstanding: 0,
      taxPaymentMonthOffset: 0,
      loanBalance: 0,
      loanAnnualRatePct: 0,
      loanMonthlyPayment: 0,
      ...overrides.liabilities,
    },
    investShareOfSurplusPct: overrides.investShareOfSurplusPct ?? 100,
    events: overrides.events ?? [],
    fi: {
      annualSpendToday: 0,
      swrPct: 3.5,
      inflationPct: 0,
      passiveAnnualIncome: 0,
      includeHomeAndVehicle: false,
      ...overrides.fi,
    },
  }
}

const START = { month: 6, year: 2026 }

// ---------------------------------------------------------------------------
// 1–2. Zero income / zero return
// ---------------------------------------------------------------------------

describe('income & return edge cases', () => {
  it('zero income + zero return keeps net worth flat', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { cash: 1_000_000 } }),
      startDate: START,
      months: 12,
    })
    expect(res.totalContributions).toBeCloseTo(0, 5)
    expect(res.totalReturns).toBeCloseTo(0, 5)
    expect(res.endingNetWorth).toBeCloseTo(1_000_000, 2)
  })

  it('zero income with returns grows only by market appreciation', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { mutualFunds: 1_000_000 }, returns: { mutualFunds: 12 } }),
      startDate: START,
      months: 12,
    })
    expect(res.totalContributions).toBeCloseTo(0, 2)
    // Monthly-compounded 12% over 12 months ≈ +12%.
    expect(res.endingNetWorth).toBeCloseTo(1_120_000, -2)
  })

  it('zero return with salary accumulates only contributions', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ employment: { annualBase: 1_200_000 } }),
      startDate: START,
      months: 12,
    })
    expect(res.totalReturns).toBeCloseTo(0, 5)
    expect(res.endingNetWorth).toBeCloseTo(1_200_000, 2)
    expect(res.totalContributions).toBeCloseTo(1_200_000, 2)
  })
})

// ---------------------------------------------------------------------------
// 3–4. Constant + increment
// ---------------------------------------------------------------------------

describe('salary behaviour', () => {
  it('constant salary and expenses nets the difference', () => {
    const res = runForecast({
      assumptions: makeAssumptions({
        employment: { annualBase: 1_200_000 },
        expenses: { monthlyBaseline: 40_000 },
      }),
      startDate: START,
      months: 12,
    })
    // (100k - 40k) * 12 = 720k
    expect(res.endingNetWorth).toBeCloseTo(720_000, 2)
  })

  it('applies annual increment in the second year', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ employment: { annualBase: 1_200_000, annualIncrementPct: 10 } }),
      startDate: START,
      months: 24,
    })
    // Year1: 1.2M, Year2: 1.32M → 2.52M
    expect(res.endingNetWorth).toBeCloseTo(2_520_000, 0)
  })

  it('models Pluralsight decline via negative growth', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ pluralsight: { monthlyIncome: 100_000, annualGrowthPct: -100 } }),
      startDate: START,
      months: 24,
    })
    // Year1 contributes 1.2M; Year2 growth factor 0 → nothing added.
    expect(res.endingNetWorth).toBeCloseTo(1_200_000, 0)
  })
})

// ---------------------------------------------------------------------------
// 8. Outstanding tax payment (balance-sheet neutral)
// ---------------------------------------------------------------------------

describe('liabilities', () => {
  it('paying outstanding tax is net-worth neutral', () => {
    const res = runForecast({
      assumptions: makeAssumptions({
        starting: { cash: 500_000 },
        liabilities: { taxOutstanding: 100_000, taxPaymentMonthOffset: 0 },
      }),
      startDate: START,
      months: 3,
    })
    expect(res.startNetWorth).toBeCloseTo(400_000, 2)
    expect(res.endingNetWorth).toBeCloseTo(400_000, 2)
    // Liability cleared after payment.
    expect(res.monthly[0].totalLiabilities).toBeCloseTo(0, 2)
  })
})

// ---------------------------------------------------------------------------
// 10. Depreciation
// ---------------------------------------------------------------------------

describe('depreciation', () => {
  it('depreciates a vehicle and tracks it separately', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { vehicle: 1_000_000 }, returns: { vehicle: -15 } }),
      startDate: START,
      months: 12,
    })
    expect(res.totalDepreciation).toBeCloseTo(150_000, -3)
    expect(res.endingNetWorth).toBeCloseTo(850_000, -3)
  })
})

// ---------------------------------------------------------------------------
// 12. Milestones
// ---------------------------------------------------------------------------

describe('milestones', () => {
  it('flags the month a milestone is first reached', () => {
    const res = runForecast({
      assumptions: makeAssumptions({
        starting: { cash: 19_900_000 },
        employment: { annualBase: 1_200_000 },
      }),
      startDate: START,
      months: 12,
    })
    const twoCr = res.milestones.find((m) => m.value === 20_000_000)!
    expect(twoCr.achieved).toBe(true)
    expect(twoCr.monthsAway).toBe(1)
    expect(twoCr.date).toBe('Jul 2026')
  })

  it('marks distant milestones as unreached', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { cash: 1_000_000 } }),
      startDate: START,
      months: 12,
    })
    expect(res.milestones.every((m) => (m.value >= 20_000_000 ? !m.achieved : true))).toBe(true)
    expect(FORECAST_MILESTONES.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 13–14. Formatting & date roll-over
// ---------------------------------------------------------------------------

describe('helpers', () => {
  it('formats Indian currency compactly', () => {
    expect(formatCompactINR(12_345_678)).toBe('₹1.23 Cr')
    expect(formatCompactINR(250_000)).toBe('₹2.5 L')
    expect(formatCompactINR(-1_000_000)).toBe('-₹10.0 L')
  })

  it('starts the forecast the month after the final actual', () => {
    expect(addMonths({ month: 6, year: 2026 }, 1).label).toBe('Jul 2026')
    expect(addMonths({ month: 12, year: 2026 }, 1).label).toBe('Jan 2027')
    expect(addMonths({ month: 1, year: 2026 }, 12).label).toBe('Jan 2027')
  })

  it('converts annual to monthly compounding correctly', () => {
    expect(Math.pow(1 + monthlyRate(12), 12) - 1).toBeCloseTo(0.12, 6)
  })
})

// ---------------------------------------------------------------------------
// 16. Reconciliation identity
// ---------------------------------------------------------------------------

describe('reconciliation', () => {
  it('reconciles for a rich mixed scenario', () => {
    const res = runForecast({
      assumptions: makeAssumptions({
        starting: { cash: 200_000, mutualFunds: 5_000_000, stocks: 3_000_000, vehicle: 800_000, pf: 1_000_000 },
        returns: { mutualFunds: 11, stocks: 10, vehicle: -15, pf: 8, cash: 3.5 },
        employment: { annualBase: 4_700_000, annualBonus: 700_000, annualRsuVesting: 1_200_000, effectiveTaxPct: 30, monthlyPfContribution: 25_000 },
        pluralsight: { monthlyIncome: 150_000, annualGrowthPct: -5, effectiveTaxPct: 25 },
        expenses: { monthlyBaseline: 120_000, annualInflationPct: 6 },
        liabilities: { taxOutstanding: 300_000, taxPaymentMonthOffset: 3 },
        investShareOfSurplusPct: 85,
      }),
      startDate: START,
      months: 120,
    })
    expect(res.reconciles).toBe(true)
    const identity =
      res.startNetWorth + res.totalContributions + res.totalReturns - res.totalDepreciation
    expect(identity).toBeCloseTo(res.endingNetWorth, 0)
  })
})

// ---------------------------------------------------------------------------
// 15 & 18. Calibration: no double-count + classification + invalid guard
// ---------------------------------------------------------------------------

describe('calibration', () => {
  const latest: MonthData = {
    month: 'Jun 2026',
    netWorth: 14_685_204,
    assets: [
      { category: 'Assets', type: 'Liquid Asset', item: 'Savings Account', amount: 2_000_000 },
      { category: 'Assets', type: 'Equity', item: 'Market Mutual Funds', amount: 6_000_000 },
      { category: 'Assets', type: 'Equity', item: 'Market Value Stocks', amount: 3_000_000 },
      { category: 'Assets', type: 'Equity Comp', item: 'Uber Vested RSU', amount: 2_000_000 },
      { category: 'Assets', type: 'Retirement', item: 'PF', amount: 1_500_000 },
      { category: 'Assets', type: 'Vehicle', item: 'Car', amount: 500_000 },
    ],
    liabilities: [{ category: 'Liabilities', type: 'Tax', item: 'Income Tax Outstanding', amount: 314_796 }],
    totalAssets: 15_000_000,
    totalLiabilities: 314_796,
    assetsByType: {},
    costBasis: {},
  }

  it('classifies items into asset classes', () => {
    expect(classifyAsset('Market Mutual Funds', 'Equity')).toBe('mutualFunds')
    expect(classifyAsset('Market Value Stocks', 'Equity')).toBe('stocks')
    expect(classifyAsset('Uber Vested RSU', 'Equity Comp')).toBe('rsu')
    expect(classifyAsset('PF', 'Retirement')).toBe('pf')
    expect(classifyAsset('Savings Account', 'Liquid Asset')).toBe('cash')
    expect(classifyAsset('Car', 'Vehicle')).toBe('vehicle')
  })

  it('anchors start net worth to the latest month without double-counting', () => {
    const profile = calibrate({ months: [latest], earnings: [], otherIncome: null })
    expect(profile.startNetWorth).toBe(14_685_204)
    const sumStart = profile.assumptions.assets.reduce((s, a) => s + a.startingValue, 0)
    expect(sumStart).toBeCloseTo(15_000_000, 2)
    expect(profile.assumptions.liabilities.taxOutstanding).toBe(314_796)
  })

  it('produces finite numbers even with empty history', () => {
    const profile = calibrate({ months: [latest], earnings: [], otherIncome: null })
    const built = buildAssumptionsForPreset(profile, 'base')
    const res = runForecast({ assumptions: built, startDate: profile.startDate, months: 60 })
    expect(Number.isFinite(res.endingNetWorth)).toBe(true)
    expect(res.reconciles).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Phase 2: scenario events
// ---------------------------------------------------------------------------

describe('scenario events', () => {
  it('a job switch raises salary from its effective month', () => {
    const jobSwitch: ScenarioEvent = {
      id: 'e1',
      type: 'jobSwitch',
      label: 'New job',
      monthOffset: 12,
      enabled: true,
      salaryHikePct: 50,
      newAnnualRsu: null,
      joiningBonus: 0,
      monthsWithoutSalary: 0,
      expenseChangePct: 0,
    }
    const res = runForecast({
      assumptions: makeAssumptions({ employment: { annualBase: 1_200_000 }, events: [jobSwitch] }),
      startDate: START,
      months: 24,
    })
    // Year 1 adds 1.2M; year 2 pays 1.5× → +1.8M. Total 3.0M.
    expect(res.endingNetWorth).toBeCloseTo(3_000_000, 0)
  })

  it('a joining bonus is a one-time taxed inflow at its month', () => {
    const jobSwitch: ScenarioEvent = {
      id: 'e2',
      type: 'jobSwitch',
      label: 'New job',
      monthOffset: 0,
      enabled: true,
      salaryHikePct: 0,
      newAnnualRsu: null,
      joiningBonus: 1_000_000,
      monthsWithoutSalary: 0,
      expenseChangePct: 0,
    }
    const res = runForecast({
      assumptions: makeAssumptions({ events: [jobSwitch], employment: { effectiveTaxPct: 30 } }),
      startDate: START,
      months: 12,
    })
    // 10L bonus taxed at 30% → 7L net, once.
    expect(res.endingNetWorth).toBeCloseTo(700_000, 0)
  })

  it('a career break zeroes salary for the gap months', () => {
    const jobSwitch: ScenarioEvent = {
      id: 'e3',
      type: 'jobSwitch',
      label: 'Sabbatical',
      monthOffset: 6,
      enabled: true,
      salaryHikePct: 0,
      newAnnualRsu: null,
      joiningBonus: 0,
      monthsWithoutSalary: 3,
      expenseChangePct: 0,
    }
    const res = runForecast({
      assumptions: makeAssumptions({ employment: { annualBase: 1_200_000 }, events: [jobSwitch] }),
      startDate: START,
      months: 12,
    })
    // 12 months of 100k, minus 3 gap months → 9 × 100k = 900k.
    expect(res.endingNetWorth).toBeCloseTo(900_000, 0)
  })

  it('shutting down Pluralsight stops that income', () => {
    const shutdown: ScenarioEvent = {
      id: 'e4',
      type: 'pluralsightChange',
      label: 'Stop courses',
      monthOffset: 6,
      enabled: true,
      action: 'shutdown',
      value: 0,
      durationMonths: 0,
    }
    const res = runForecast({
      assumptions: makeAssumptions({ pluralsight: { monthlyIncome: 100_000 }, events: [shutdown] }),
      startDate: START,
      months: 12,
    })
    // 6 months at 100k, then 0 → 600k.
    expect(res.endingNetWorth).toBeCloseTo(600_000, 0)
  })

  it('a one-off cash flow moves net worth once', () => {
    const windfall: ScenarioEvent = {
      id: 'e5', type: 'cashflow', label: 'Gift', monthOffset: 3, enabled: true, amount: 500_000,
    }
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { cash: 1_000_000 }, events: [windfall] }),
      startDate: START,
      months: 12,
    })
    expect(res.endingNetWorth).toBeCloseTo(1_500_000, 2)
  })

  it('a financed purchase is net-worth-neutral at the moment of purchase', () => {
    const purchase: ScenarioEvent = {
      id: 'e6',
      type: 'purchase',
      label: 'Car',
      monthOffset: 2,
      enabled: true,
      assetClass: 'vehicle',
      price: 1_500_000,
      downPayment: 300_000,
      loanAmount: 1_200_000,
      loanMonthlyPayment: 0,
      loanRatePct: 0,
    }
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { cash: 2_000_000 }, events: [purchase] }),
      startDate: START,
      months: 3,
    })
    // No returns/depreciation set → buying a car with a loan leaves NW unchanged.
    expect(res.endingNetWorth).toBeCloseTo(2_000_000, 2)
    expect(res.monthly[2].valueByAsset.vehicle).toBeCloseTo(1_500_000, 2)
    expect(res.monthly[2].totalLiabilities).toBeCloseTo(1_200_000, 2)
    expect(res.reconciles).toBe(true)
  })

  it('reconciles with a rich mix of events', () => {
    const events: ScenarioEvent[] = [
      { id: 'a', type: 'jobSwitch', label: 'Switch', monthOffset: 18, enabled: true, salaryHikePct: 25, newAnnualRsu: 2_000_000, joiningBonus: 800_000, monthsWithoutSalary: 2, expenseChangePct: 10 },
      { id: 'b', type: 'pluralsightChange', label: 'Halve', monthOffset: 24, enabled: true, action: 'multiply', value: 0.5, durationMonths: 12 },
      { id: 'c', type: 'expenseChange', label: 'Baby', monthOffset: 30, enabled: true, changePct: 20 },
      { id: 'd', type: 'cashflow', label: 'Windfall', monthOffset: 40, enabled: true, amount: 1_000_000 },
      { id: 'e', type: 'purchase', label: 'Home', monthOffset: 48, enabled: true, assetClass: 'realEstate', price: 15_000_000, downPayment: 3_000_000, loanAmount: 12_000_000, loanMonthlyPayment: 110_000, loanRatePct: 8.5 },
    ]
    const res = runForecast({
      assumptions: makeAssumptions({
        starting: { cash: 500_000, mutualFunds: 5_000_000, stocks: 3_000_000, pf: 1_000_000, realEstate: 0 },
        returns: { mutualFunds: 11, stocks: 10, pf: 8, cash: 3.5, realEstate: 6, vehicle: -15 },
        employment: { annualBase: 4_700_000, annualBonus: 700_000, annualRsuVesting: 1_200_000, effectiveTaxPct: 30, monthlyPfContribution: 25_000 },
        pluralsight: { monthlyIncome: 150_000, effectiveTaxPct: 25 },
        expenses: { monthlyBaseline: 120_000, annualInflationPct: 6 },
        investShareOfSurplusPct: 85,
        events,
      }),
      startDate: START,
      months: 120,
    })
    expect(res.reconciles).toBe(true)
    const identity = res.startNetWorth + res.totalContributions + res.totalReturns - res.totalDepreciation
    expect(identity).toBeCloseTo(res.endingNetWorth, 0)
  })
})

// ---------------------------------------------------------------------------
// Phase 2: financial independence
// ---------------------------------------------------------------------------

describe('financial independence', () => {
  it('computes the corpus required today from spend and SWR', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { cash: 10_000_000 } }),
      startDate: START,
      months: 12,
    })
    const fi = computeFI(res, {
      annualSpendToday: 1_200_000,
      swrPct: 4,
      inflationPct: 0,
      passiveAnnualIncome: 0,
      includeHomeAndVehicle: true,
    })
    // 12L / 4% = 3 Cr.
    expect(fi.requiredCorpusToday).toBeCloseTo(30_000_000, 2)
    expect(fi.safeMonthlyIncomeNow).toBeCloseTo((10_000_000 * 0.04) / 12, 2)
  })

  it('flags FI as achieved once qualifying net worth clears the target', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { cash: 40_000_000 } }),
      startDate: START,
      months: 12,
    })
    const fi = computeFI(res, {
      annualSpendToday: 1_200_000,
      swrPct: 4,
      inflationPct: 0,
      passiveAnnualIncome: 0,
      includeHomeAndVehicle: true,
    })
    // 4 Cr already clears the 3 Cr target in month 1.
    expect(fi.achieved).toBe(true)
    expect(fi.monthsAway).toBe(1)
  })

  it('excludes home & vehicle from the corpus when asked', () => {
    const res = runForecast({
      assumptions: makeAssumptions({ starting: { cash: 20_000_000, realEstate: 15_000_000 } }),
      startDate: START,
      months: 12,
    })
    const fi = computeFI(res, {
      annualSpendToday: 1_200_000,
      swrPct: 4,
      inflationPct: 0,
      passiveAnnualIncome: 0,
      includeHomeAndVehicle: false,
    })
    // Only the 2 Cr liquid counts, which is short of the 3 Cr target.
    expect(fi.achieved).toBe(false)
  })
})
