'use client'

import { useCallback, useEffect, useState } from 'react'
import { ComparisonResponse, HistoryPoint, toHistory } from '@/lib/netWorth'
import { calibrate, CalibrationInput, EarningsRecord, OtherIncomePayload } from '@/lib/forecast/calibration'
import { buildBuiltInScenarios } from '@/lib/forecast/scenarios'
import { CalibrationProfile, ForecastScenario } from '@/lib/forecast/types'
import { loadStoredScenarios, resyncAnchor } from '@/lib/forecast/storage'

interface ForecastData {
  loading: boolean
  error: string | null
  profile: CalibrationProfile | null
  /** Freshly-built built-ins merged with any persisted edits / custom scenarios. */
  scenarios: ForecastScenario[]
  /** Chronological actual net-worth history for the chart. */
  history: HistoryPoint[]
  reload: () => void
}

/**
 * Merge freshly-calibrated built-ins with persisted scenarios:
 *  - built-ins the user edited are restored (with the balance sheet re-anchored)
 *  - custom scenarios are appended (also re-anchored)
 */
function mergeScenarios(profile: CalibrationProfile, stored: ForecastScenario[] | null): ForecastScenario[] {
  const fresh = buildBuiltInScenarios(profile)
  if (!stored || stored.length === 0) return fresh

  const storedById = new Map(stored.map((s) => [s.id, s]))
  const merged = fresh.map((f) => {
    const saved = storedById.get(f.id)
    return saved ? resyncAnchor({ ...saved, builtIn: true, preset: f.preset }, profile) : f
  })
  for (const s of stored) {
    if (!s.builtIn && !merged.some((m) => m.id === s.id)) {
      merged.push(resyncAnchor(s, profile))
    }
  }
  return merged
}

export function useForecastData(): ForecastData {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<CalibrationProfile | null>(null)
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [compRes, earnRes, otherRes] = await Promise.all([
        fetch('/api/comparison'),
        fetch('/api/earnings'),
        fetch('/api/other-income'),
      ])

      if (!compRes.ok) {
        setError(
          compRes.status === 401
            ? 'Your Google session expired. Sign out and sign in again to reload the sheet.'
            : 'Could not load your net worth data. Please try again.',
        )
        return
      }

      const comp: ComparisonResponse = await compRes.json()
      if (!comp.months || comp.months.length === 0) {
        setError('No net worth data found. Add dated month columns to the "Net Worth" sheet.')
        return
      }

      const earnings: EarningsRecord[] = earnRes.ok ? (await earnRes.json()).earnings ?? [] : []
      const otherIncome: OtherIncomePayload | null = otherRes.ok ? await otherRes.json() : null

      const input: CalibrationInput = { months: comp.months, earnings, otherIncome }
      const nextProfile = calibrate(input)
      setProfile(nextProfile)
      setHistory(toHistory(comp.months))
      setScenarios(mergeScenarios(nextProfile, loadStoredScenarios()))
    } catch (err) {
      console.error('Error loading forecast data:', err)
      setError('Failed to load data. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, profile, scenarios, history, reload: load }
}
