/**
 * Scenario presets: per-asset-class return tables and the growth/inflation
 * knobs that distinguish Conservative / Base / Aggressive.
 *
 * These are *editable forecasting assumptions*, not guaranteed returns. They
 * are applied on top of a live-data CalibrationProfile (which supplies the
 * balance-sheet anchor and income/expense baselines).
 */

import {
  AssetClassId,
  BuiltInScenarioId,
  CalibrationProfile,
  ForecastAssumptions,
  ForecastScenario,
} from './types'

/** Expected annual return (%) per asset class, per scenario preset. */
export const RETURN_TABLES: Record<BuiltInScenarioId, Record<AssetClassId, number>> = {
  conservative: {
    cash: 3,
    mutualFunds: 7,
    stocks: 6,
    // RSUs track employer equity (Uber/ServiceNow). Uber since-IPO CAGR ≈ 8%;
    // we set a cautious floor here.
    rsu: 5,
    pf: 7,
    realEstate: 4,
    gold: 5,
    crypto: -5,
    vehicle: -15,
    other: 5,
  },
  base: {
    cash: 3.5,
    mutualFunds: 11,
    stocks: 10,
    // ≈ Uber's 7-year average annual return (~10.5%).
    rsu: 10,
    pf: 8,
    realEstate: 6,
    gold: 7,
    crypto: 5,
    vehicle: -15,
    other: 7,
  },
  aggressive: {
    cash: 4,
    mutualFunds: 14,
    stocks: 15,
    // ≈ Uber's higher 7-year CAGR estimate (~14%).
    rsu: 15,
    pf: 8.5,
    realEstate: 8,
    gold: 9,
    crypto: 15,
    vehicle: -15,
    other: 9,
  },
}

/** Growth / inflation knobs that vary by scenario preset. */
interface PresetKnobs {
  name: string
  /** Annual salary increment. */
  incrementPct: number
  /** Annual growth of RSU grant value. */
  rsuGrowthPct: number
  /** Pluralsight annual growth (negative = decline). */
  pluralsightGrowthPct: number
  /** Expense inflation. */
  inflationPct: number
  /** Share of surplus invested (rest kept as cash). */
  investSharePct: number
}

export const PRESET_KNOBS: Record<BuiltInScenarioId, PresetKnobs> = {
  conservative: {
    name: 'Conservative',
    incrementPct: 6,
    rsuGrowthPct: 5,
    pluralsightGrowthPct: -25,
    inflationPct: 6.5,
    investSharePct: 80,
  },
  base: {
    name: 'Base',
    incrementPct: 8,
    rsuGrowthPct: 10,
    pluralsightGrowthPct: -5,
    inflationPct: 6,
    investSharePct: 85,
  },
  aggressive: {
    name: 'Aggressive',
    incrementPct: 10,
    rsuGrowthPct: 15,
    pluralsightGrowthPct: 8,
    inflationPct: 5.5,
    investSharePct: 90,
  },
}

export const BUILT_IN_ORDER: BuiltInScenarioId[] = ['conservative', 'base', 'aggressive']

/**
 * Build a full assumption set for a preset by layering scenario knobs and the
 * return table over a live calibration profile. The profile owns the
 * balance-sheet anchor (starting values, liabilities) and income/expense
 * baselines; the scenario owns returns and growth rates.
 */
export function buildAssumptionsForPreset(
  profile: CalibrationProfile,
  preset: BuiltInScenarioId,
): ForecastAssumptions {
  const base = profile.assumptions
  const knobs = PRESET_KNOBS[preset]
  const table = RETURN_TABLES[preset]

  return {
    ...base,
    employment: {
      ...base.employment,
      annualIncrementPct: knobs.incrementPct,
      rsuGrowthPct: knobs.rsuGrowthPct,
    },
    pluralsight: {
      ...base.pluralsight,
      annualGrowthPct: knobs.pluralsightGrowthPct,
    },
    expenses: {
      ...base.expenses,
      annualInflationPct: knobs.inflationPct,
    },
    investShareOfSurplusPct: knobs.investSharePct,
    assets: base.assets.map((a) => ({ ...a, annualReturnPct: table[a.id] })),
    liabilities: { ...base.liabilities },
    // Events are carried through from the profile (usually empty for built-ins).
    events: base.events ?? [],
    // Keep FI's inflation assumption aligned with the scenario's inflation knob.
    fi: { ...base.fi, inflationPct: knobs.inflationPct },
  }
}

/** The three built-in scenarios derived from a calibration profile. */
export function buildBuiltInScenarios(profile: CalibrationProfile): ForecastScenario[] {
  return BUILT_IN_ORDER.map((preset) => ({
    id: preset,
    name: PRESET_KNOBS[preset].name,
    builtIn: true,
    preset,
    assumptions: buildAssumptionsForPreset(profile, preset),
  }))
}
