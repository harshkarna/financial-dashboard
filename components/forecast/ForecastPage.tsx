'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, RefreshCw, SlidersHorizontal, Copy, Info, X } from 'lucide-react'
import { useForecastData } from '@/hooks/useForecastData'
import { runForecast } from '@/lib/forecast/engine'
import { buildAssumptionsForPreset } from '@/lib/forecast/scenarios'
import { saveHorizon, saveSelectedId, saveStoredScenarios, loadHorizon, loadSelectedId } from '@/lib/forecast/storage'
import { ForecastAssumptions, ForecastScenario, HORIZONS, HorizonKey, ScenarioEvent } from '@/lib/forecast/types'
import { ForecastKpis } from './ForecastKpis'
import { ForecastChart } from './ForecastChart'
import { AnnualTable } from './AnnualTable'
import { AssumptionsPanel } from './AssumptionsPanel'
import { ForecastGuide } from './ForecastGuide'
import { EventsTimeline } from './EventsTimeline'
import { ForecastInsights } from './ForecastInsights'
import { ScenarioComparison } from './ScenarioComparison'
import { CompositionChart, AttributionChart } from './AdvancedCharts'

export function ForecastPage() {
  const { loading, error, profile, scenarios: loadedScenarios, history, reload } = useForecastData()

  const [scenarios, setScenarios] = useState<ForecastScenario[]>([])
  const [selectedId, setSelectedId] = useState<string>('base')
  const [horizon, setHorizon] = useState<HorizonKey>('5Y')
  const [panelOpen, setPanelOpen] = useState(false)

  // Adopt freshly-loaded/merged scenarios, restoring persisted view state.
  useEffect(() => {
    if (loadedScenarios.length === 0) return
    setScenarios(loadedScenarios)
    const storedSel = loadSelectedId()
    setSelectedId(storedSel && loadedScenarios.some((s) => s.id === storedSel) ? storedSel : 'base')
    const storedHz = loadHorizon()
    if (storedHz) setHorizon(storedHz)
  }, [loadedScenarios])

  const active = useMemo(
    () => scenarios.find((s) => s.id === selectedId) ?? scenarios[0],
    [scenarios, selectedId],
  )

  const horizonYears = HORIZONS.find((h) => h.key === horizon)?.years ?? 5

  const result = useMemo(() => {
    if (!profile || !active) return null
    return runForecast({
      assumptions: active.assumptions,
      startDate: profile.startDate,
      months: horizonYears * 12,
    })
  }, [profile, active, horizonYears])

  const persist = (next: ForecastScenario[]) => {
    setScenarios(next)
    saveStoredScenarios(next)
  }

  const handleAssumptionsChange = (nextAssumptions: ForecastAssumptions) => {
    if (!active) return
    persist(scenarios.map((s) => (s.id === active.id ? { ...s, assumptions: nextAssumptions } : s)))
  }

  const handleEventToggle = (id: string, enabled: boolean) => {
    if (!active) return
    const events = active.assumptions.events.map((e: ScenarioEvent) => (e.id === id ? { ...e, enabled } : e))
    handleAssumptionsChange({ ...active.assumptions, events })
  }

  const handleReset = () => {
    if (!active || !profile) return
    const fresh = buildAssumptionsForPreset(profile, active.preset)
    persist(scenarios.map((s) => (s.id === active.id ? { ...s, assumptions: fresh } : s)))
  }

  const handleDuplicate = () => {
    if (!active) return
    const id = `custom-${Date.now()}`
    const copy: ForecastScenario = {
      id,
      name: `${active.name} (copy)`,
      builtIn: false,
      preset: active.preset,
      assumptions: JSON.parse(JSON.stringify(active.assumptions)),
    }
    persist([...scenarios, copy])
    setSelectedId(id)
    saveSelectedId(id)
    setPanelOpen(true)
  }

  const selectScenario = (id: string) => {
    setSelectedId(id)
    saveSelectedId(id)
  }

  const handleDelete = (id: string) => {
    const target = scenarios.find((s) => s.id === id)
    if (!target || target.builtIn) return
    persist(scenarios.filter((s) => s.id !== id))
    if (selectedId === id) {
      setSelectedId('base')
      saveSelectedId('base')
    }
  }

  const selectHorizon = (h: HorizonKey) => {
    setHorizon(h)
    saveHorizon(h)
  }

  if (loading) return <ForecastSkeleton />

  if (error || !profile || !active || !result) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="nw-card flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="grid place-items-center w-14 h-14 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="w-7 h-7 nw-loss" />
          </div>
          <h3 className="text-lg font-semibold nw-text-primary mb-2">Couldn’t build your forecast</h3>
          <p className="nw-text-secondary mb-6 max-w-md">
            {error ?? 'We need at least one month of net worth data to project from.'}
          </p>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  const horizonLabel = HORIZONS.find((h) => h.key === horizon)?.label ?? '5Y'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold nw-text-primary tracking-tight">Financial Forecast</h1>
            <p className="text-sm nw-text-secondary mt-1 max-w-2xl">
              Explore how income, investments, expenses, and major decisions may shape your future net worth.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Horizon pills */}
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5" role="tablist" aria-label="Forecast horizon">
              {HORIZONS.map((h) => (
                <button
                  key={h.key}
                  role="tab"
                  aria-selected={h.key === horizon}
                  data-active={h.key === horizon}
                  onClick={() => selectHorizon(h.key)}
                  className="nw-control px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Scenario pills */}
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5 overflow-x-auto hide-scrollbar" role="tablist" aria-label="Scenario">
              {scenarios.map((s) => {
                const isSel = s.id === selectedId
                if (s.builtIn) {
                  return (
                    <button
                      key={s.id}
                      role="tab"
                      aria-selected={isSel}
                      data-active={isSel}
                      onClick={() => selectScenario(s.id)}
                      className="nw-control px-3 py-1 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    >
                      {s.name}
                    </button>
                  )
                }
                return (
                  <span
                    key={s.id}
                    data-active={isSel}
                    className="nw-control inline-flex items-center gap-1 pl-3 pr-1 py-1 whitespace-nowrap"
                  >
                    <button
                      role="tab"
                      aria-selected={isSel}
                      onClick={() => selectScenario(s.id)}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 rounded"
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      aria-label={`Delete ${s.name}`}
                      title="Delete scenario"
                      className="grid place-items-center w-4 h-4 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </div>

            <div className="flex items-center gap-2 lg:ml-auto">
              <button
                onClick={handleDuplicate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium nw-control"
                title="Duplicate into an editable custom scenario"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={() => setPanelOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Edit assumptions
              </button>
            </div>
          </div>
        </div>

        {/* Explainer */}
        <ForecastGuide />

        {/* KPIs */}
        <ForecastKpis result={result} horizonLabel={horizonLabel} />

        {/* Chart */}
        <ForecastChart history={history} result={result} scenarioName={active.name} />

        {/* Life events driving this scenario */}
        <EventsTimeline
          events={active.assumptions.events}
          startDate={profile.startDate}
          onEdit={() => setPanelOpen(true)}
          onToggle={handleEventToggle}
        />

        {/* Insights */}
        <ForecastInsights result={result} horizonLabel={horizonLabel} />

        {/* Scenario comparison */}
        <ScenarioComparison
          scenarios={scenarios}
          startDate={profile.startDate}
          horizonYears={horizonYears}
          horizonLabel={horizonLabel}
        />

        {/* Breakdown charts */}
        <div className="grid gap-5 xl:grid-cols-2">
          <AttributionChart result={result} />
          <CompositionChart result={result} />
        </div>

        {/* Annual table */}
        <AnnualTable annual={result.annual} scenarioName={active.name} />

        {/* Disclaimer */}
        <p className="flex items-start gap-2 text-xs nw-text-muted leading-relaxed">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          Forecasts are based on assumptions and historical information. Actual income, expenses, taxes,
          and investment returns may differ materially. This is not financial advice.
        </p>
      </div>

      <AssumptionsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        assumptions={active.assumptions}
        sources={profile.sources}
        scenarioName={active.name}
        builtIn={active.builtIn}
        startDate={profile.startDate}
        onChange={handleAssumptionsChange}
        onReset={handleReset}
      />
    </div>
  )
}

function ForecastSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-5">
        <div className="h-9 w-56 rounded-lg bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="h-9 w-full max-w-lg rounded-lg bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}
