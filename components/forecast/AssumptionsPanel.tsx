'use client'

import { ReactNode } from 'react'
import { X, RotateCcw, AlertTriangle } from 'lucide-react'
import { AssumptionSources, ForecastAssumptions, ScenarioEvent } from '@/lib/forecast/types'
import { EventsEditor } from './EventsEditor'

interface AssumptionsPanelProps {
  open: boolean
  onClose: () => void
  assumptions: ForecastAssumptions
  sources: AssumptionSources
  scenarioName: string
  builtIn: boolean
  startDate: { month: number; year: number }
  onChange: (next: ForecastAssumptions) => void
  onReset: () => void
}

/** Numeric field. Empty / invalid input is coerced to 0 (never NaN). */
function NumberField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  source,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  unit?: string
  min?: number
  max?: number
  source?: string
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs nw-text-secondary">{label}</span>
        {source && (
          <span className="text-[10px] nw-text-muted px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5">
            {source}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center rounded-lg border nw-hairline bg-white dark:bg-white/5 focus-within:ring-2 focus-within:ring-indigo-400/50">
        {unit === '₹' && <span className="pl-2.5 text-sm nw-text-muted">₹</span>}
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value)
            let v = Number.isFinite(parsed) ? parsed : 0
            if (min !== undefined) v = Math.max(min, v)
            if (max !== undefined) v = Math.min(max, v)
            onChange(v)
          }}
          className="w-full bg-transparent px-2.5 py-1.5 text-sm nw-text-primary tabnums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unit && unit !== '₹' && <span className="pr-2.5 text-sm nw-text-muted">{unit}</span>}
      </div>
    </label>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide nw-text-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

export function AssumptionsPanel({
  open,
  onClose,
  assumptions,
  sources,
  scenarioName,
  startDate,
  onChange,
  onReset,
}: AssumptionsPanelProps) {
  if (!open) return null

  const a = assumptions

  const patch = (partial: Partial<ForecastAssumptions>) => onChange({ ...a, ...partial })
  const patchEmployment = (p: Partial<ForecastAssumptions['employment']>) =>
    patch({ employment: { ...a.employment, ...p } })
  const patchPl = (p: Partial<ForecastAssumptions['pluralsight']>) =>
    patch({ pluralsight: { ...a.pluralsight, ...p } })
  const patchOther = (p: Partial<ForecastAssumptions['otherIncome']>) =>
    patch({ otherIncome: { ...a.otherIncome, ...p } })
  const patchExpenses = (p: Partial<ForecastAssumptions['expenses']>) =>
    patch({ expenses: { ...a.expenses, ...p } })
  const patchLiabilities = (p: Partial<ForecastAssumptions['liabilities']>) =>
    patch({ liabilities: { ...a.liabilities, ...p } })
  const patchAsset = (id: string, p: { annualReturnPct?: number; contributionPct?: number }) =>
    patch({ assets: a.assets.map((x) => (x.id === id ? { ...x, ...p } : x)) })

  const investable = a.assets.filter((x) => x.investable)
  const allocationSum = investable.reduce((s, x) => s + x.contributionPct, 0)
  const allocationValid = Math.abs(allocationSum - 100) < 0.5

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#0f131a] shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b nw-hairline">
          <div>
            <h2 className="text-base font-semibold nw-text-primary">Edit assumptions</h2>
            <p className="text-xs nw-text-muted">{scenarioName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium nw-control"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="grid place-items-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 nw-text-secondary"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <Group title="Employment (Uber)">
            <NumberField label="Annual base" value={a.employment.annualBase} unit="₹" min={0} source={sources.employment} onChange={(v) => patchEmployment({ annualBase: v })} />
            <NumberField label="Annual bonus" value={a.employment.annualBonus} unit="₹" min={0} onChange={(v) => patchEmployment({ annualBonus: v })} />
            <NumberField label="Annual RSU vesting" value={a.employment.annualRsuVesting} unit="₹" min={0} onChange={(v) => patchEmployment({ annualRsuVesting: v })} />
            <NumberField label="Monthly PF" value={a.employment.monthlyPfContribution} unit="₹" min={0} onChange={(v) => patchEmployment({ monthlyPfContribution: v })} />
            <NumberField label="Annual increment" value={a.employment.annualIncrementPct} unit="%" onChange={(v) => patchEmployment({ annualIncrementPct: v })} />
            <NumberField label="RSU growth" value={a.employment.rsuGrowthPct} unit="%" onChange={(v) => patchEmployment({ rsuGrowthPct: v })} />
            <NumberField label="Effective tax" value={a.employment.effectiveTaxPct} unit="%" min={0} max={100} onChange={(v) => patchEmployment({ effectiveTaxPct: v })} />
          </Group>

          <Group title="Pluralsight">
            <NumberField label="Monthly income" value={a.pluralsight.monthlyIncome} unit="₹" min={0} source={sources.pluralsight} onChange={(v) => patchPl({ monthlyIncome: v })} />
            <NumberField label="Annual growth" value={a.pluralsight.annualGrowthPct} unit="%" onChange={(v) => patchPl({ annualGrowthPct: v })} />
            <NumberField label="Effective tax" value={a.pluralsight.effectiveTaxPct} unit="%" min={0} max={100} onChange={(v) => patchPl({ effectiveTaxPct: v })} />
          </Group>

          <Group title="Other income">
            <NumberField label="Monthly income" value={a.otherIncome.monthlyIncome} unit="₹" min={0} onChange={(v) => patchOther({ monthlyIncome: v })} />
            <NumberField label="Annual growth" value={a.otherIncome.annualGrowthPct} unit="%" onChange={(v) => patchOther({ annualGrowthPct: v })} />
            <NumberField label="Effective tax" value={a.otherIncome.effectiveTaxPct} unit="%" min={0} max={100} onChange={(v) => patchOther({ effectiveTaxPct: v })} />
          </Group>

          <Group title="Expenses & inflation">
            <NumberField label="Monthly baseline" value={a.expenses.monthlyBaseline} unit="₹" min={0} source={sources.expenses} onChange={(v) => patchExpenses({ monthlyBaseline: v })} />
            <NumberField label="Annual inflation" value={a.expenses.annualInflationPct} unit="%" onChange={(v) => patchExpenses({ annualInflationPct: v })} />
            <NumberField label="Invest % of surplus" value={a.investShareOfSurplusPct} unit="%" min={0} max={100} onChange={(v) => patch({ investShareOfSurplusPct: v })} />
          </Group>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide nw-text-muted">Expected annual returns</h3>
            <div className="grid grid-cols-2 gap-3">
              {a.assets.map((asset) => (
                <NumberField
                  key={asset.id}
                  label={asset.label}
                  value={asset.annualReturnPct}
                  unit="%"
                  onChange={(v) => patchAsset(asset.id, { annualReturnPct: v })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide nw-text-muted">Contribution allocation</h3>
              <span className={`text-xs font-medium ${allocationValid ? 'nw-text-muted' : 'nw-loss'}`}>
                {allocationSum.toFixed(0)}%
              </span>
            </div>
            {!allocationValid && (
              <p className="flex items-center gap-1.5 text-xs nw-loss">
                <AlertTriangle className="w-3.5 h-3.5" />
                Allocation should total 100% (currently {allocationSum.toFixed(0)}%).
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {investable.map((asset) => (
                <NumberField
                  key={asset.id}
                  label={asset.label}
                  value={asset.contributionPct}
                  unit="%"
                  min={0}
                  max={100}
                  onChange={(v) => patchAsset(asset.id, { contributionPct: v })}
                />
              ))}
            </div>
          </div>

          <Group title="Liabilities & tax">
            <NumberField label="Tax outstanding" value={a.liabilities.taxOutstanding} unit="₹" min={0} source={sources.taxOutstanding} onChange={(v) => patchLiabilities({ taxOutstanding: v })} />
            <NumberField label="Tax paid in month #" value={a.liabilities.taxPaymentMonthOffset} min={0} onChange={(v) => patchLiabilities({ taxPaymentMonthOffset: Math.round(v) })} />
            <NumberField label="Loan balance" value={a.liabilities.loanBalance} unit="₹" min={0} onChange={(v) => patchLiabilities({ loanBalance: v })} />
            <NumberField label="Loan rate" value={a.liabilities.loanAnnualRatePct} unit="%" min={0} onChange={(v) => patchLiabilities({ loanAnnualRatePct: v })} />
            <NumberField label="Loan monthly pay" value={a.liabilities.loanMonthlyPayment} unit="₹" min={0} onChange={(v) => patchLiabilities({ loanMonthlyPayment: v })} />
          </Group>

          <div className="border-t nw-hairline pt-4">
            <EventsEditor
              events={a.events}
              startDate={startDate}
              onChange={(events) => patch({ events })}
            />
          </div>

          <p className="text-[11px] nw-text-muted leading-relaxed border-t nw-hairline pt-3">
            Starting balances are re-anchored from your live Net Worth sheet ({sources.startingValues}).
            Edits are saved to this browser only.
          </p>
        </div>
      </div>
    </div>
  )
}
