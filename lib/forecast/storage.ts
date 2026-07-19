/**
 * localStorage persistence for forecast scenarios and view state.
 *
 * We persist the scenario "policy" (returns, income, expenses, allocation,
 * growth) but ALWAYS re-anchor the balance sheet (starting asset values and
 * tax provision) from live data on load — so a scenario saved months ago still
 * projects from today's real net worth. See `resyncAnchor`.
 */

import {
  AssetClassId,
  CalibrationProfile,
  ForecastScenario,
  HorizonKey,
} from './types'

// Bump the version to invalidate persisted scenarios when built-in defaults change.
const SCENARIOS_KEY = 'forecast.scenarios.v3'
const SELECTED_KEY = 'forecast.selectedScenario.v1'
const HORIZON_KEY = 'forecast.horizon.v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function loadStoredScenarios(): ForecastScenario[] | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(SCENARIOS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ForecastScenario[]) : null
  } catch {
    return null
  }
}

export function saveStoredScenarios(scenarios: ForecastScenario[]): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios))
  } catch {
    /* quota / serialization issues are non-fatal */
  }
}

export function loadSelectedId(): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(SELECTED_KEY)
}

export function saveSelectedId(id: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(SELECTED_KEY, id)
  } catch {
    /* ignore */
  }
}

export function loadHorizon(): HorizonKey | null {
  if (!isBrowser()) return null
  const v = window.localStorage.getItem(HORIZON_KEY)
  return (v as HorizonKey) || null
}

export function saveHorizon(h: HorizonKey): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(HORIZON_KEY, h)
  } catch {
    /* ignore */
  }
}

/**
 * Re-anchor a persisted scenario to the current balance sheet: refresh each
 * asset's starting value and the tax provision from the live profile while
 * keeping the user's saved policy (returns, contributions, income, expenses).
 */
export function resyncAnchor(
  scenario: ForecastScenario,
  profile: CalibrationProfile,
): ForecastScenario {
  const liveByClass = {} as Record<AssetClassId, number>
  for (const a of profile.assumptions.assets) liveByClass[a.id] = a.startingValue

  return {
    ...scenario,
    assumptions: {
      ...scenario.assumptions,
      assets: scenario.assumptions.assets.map((a) => ({
        ...a,
        startingValue: liveByClass[a.id] ?? a.startingValue,
      })),
      liabilities: {
        ...scenario.assumptions.liabilities,
        taxOutstanding: profile.assumptions.liabilities.taxOutstanding,
      },
    },
  }
}
