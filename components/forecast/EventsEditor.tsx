'use client'

import { useState } from 'react'
import { Plus, Trash2, CalendarClock } from 'lucide-react'
import {
  AssetClassId,
  ASSET_CLASS_LABELS,
  ScenarioEvent,
  ScenarioEventType,
} from '@/lib/forecast/types'
import { makeEvent, eventDateLabel, SCENARIO_EVENT_LABELS } from '@/lib/forecast/events'

interface EventsEditorProps {
  events: ScenarioEvent[]
  startDate: { month: number; year: number }
  onChange: (next: ScenarioEvent[]) => void
}

const EVENT_TYPES: ScenarioEventType[] = [
  'jobSwitch',
  'pluralsightChange',
  'expenseChange',
  'cashflow',
  'purchase',
]

const PURCHASE_CLASSES: AssetClassId[] = ['realEstate', 'vehicle', 'gold', 'stocks', 'other']

export function EventsEditor({ events, startDate, onChange }: EventsEditorProps) {
  const [adding, setAdding] = useState(false)

  const update = (id: string, patch: Partial<ScenarioEvent>) =>
    onChange(events.map((e) => (e.id === id ? ({ ...e, ...patch } as ScenarioEvent) : e)))
  const remove = (id: string) => onChange(events.filter((e) => e.id !== id))
  const add = (type: ScenarioEventType) => {
    onChange([...events, makeEvent(type)])
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide nw-text-muted">Life events</h3>
        <div className="relative">
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium nw-control"
          >
            <Plus className="w-3.5 h-3.5" />
            Add event
          </button>
          {adding && (
            <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border nw-hairline bg-white dark:bg-[#141922] shadow-lg py-1">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => add(t)}
                  className="block w-full text-left px-3 py-1.5 text-xs nw-text-secondary hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  {SCENARIO_EVENT_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {events.length === 0 && (
        <p className="text-xs nw-text-muted">
          No events yet. Model a job switch, a course-income change, a big purchase, or a windfall to
          see how a decision changes your trajectory.
        </p>
      )}

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="rounded-xl border nw-hairline p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                value={e.label}
                onChange={(ev) => update(e.id, { label: ev.target.value })}
                className="flex-1 min-w-0 bg-transparent text-sm font-medium nw-text-primary outline-none border-b border-transparent focus:border-indigo-400/50"
              />
              <label className="inline-flex items-center gap-1 text-[11px] nw-text-muted">
                <input
                  type="checkbox"
                  checked={e.enabled}
                  onChange={(ev) => update(e.id, { enabled: ev.target.checked })}
                  className="accent-indigo-600"
                />
                On
              </label>
              <button
                onClick={() => remove(e.id)}
                aria-label="Remove event"
                className="grid place-items-center w-6 h-6 rounded-md hover:bg-black/5 dark:hover:bg-white/10 nw-text-muted"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <Mini label="Starts in month #" hint={eventDateLabel(startDate, e.monthOffset)}>
              <NumInput value={e.monthOffset} min={0} onChange={(v) => update(e.id, { monthOffset: Math.round(v) })} />
            </Mini>

            {e.type === 'jobSwitch' && (
              <div className="grid grid-cols-2 gap-2">
                <Mini label="Salary change %"><NumInput value={e.salaryHikePct} onChange={(v) => update(e.id, { salaryHikePct: v })} /></Mini>
                <Mini label="Joining bonus ₹"><NumInput value={e.joiningBonus} min={0} onChange={(v) => update(e.id, { joiningBonus: v })} /></Mini>
                <Mini label="Break (months)"><NumInput value={e.monthsWithoutSalary} min={0} onChange={(v) => update(e.id, { monthsWithoutSalary: Math.round(v) })} /></Mini>
                <Mini label="Spend change %"><NumInput value={e.expenseChangePct} onChange={(v) => update(e.id, { expenseChangePct: v })} /></Mini>
                <label className="col-span-2 flex items-center gap-2 text-[11px] nw-text-muted">
                  <input
                    type="checkbox"
                    checked={e.newAnnualRsu !== null}
                    onChange={(ev) => update(e.id, { newAnnualRsu: ev.target.checked ? 1_500_000 : null })}
                    className="accent-indigo-600"
                  />
                  Reset annual RSU
                  {e.newAnnualRsu !== null && (
                    <span className="flex-1"><NumInput value={e.newAnnualRsu} min={0} onChange={(v) => update(e.id, { newAnnualRsu: v })} /></span>
                  )}
                </label>
              </div>
            )}

            {e.type === 'pluralsightChange' && (
              <div className="grid grid-cols-2 gap-2">
                <Mini label="Action">
                  <Select
                    value={e.action}
                    options={[
                      { value: 'shutdown', label: 'Shut down' },
                      { value: 'multiply', label: 'Multiply ×' },
                      { value: 'setMonthly', label: 'Set ₹/mo' },
                    ]}
                    onChange={(v) => update(e.id, { action: v as typeof e.action })}
                  />
                </Mini>
                {e.action !== 'shutdown' && (
                  <Mini label={e.action === 'multiply' ? 'Factor' : 'Monthly ₹'}>
                    <NumInput value={e.value} min={0} onChange={(v) => update(e.id, { value: v })} />
                  </Mini>
                )}
                <Mini label="Duration (0 = forever)"><NumInput value={e.durationMonths} min={0} onChange={(v) => update(e.id, { durationMonths: Math.round(v) })} /></Mini>
              </div>
            )}

            {e.type === 'expenseChange' && (
              <Mini label="Monthly spend change %"><NumInput value={e.changePct} onChange={(v) => update(e.id, { changePct: v })} /></Mini>
            )}

            {e.type === 'cashflow' && (
              <Mini label="Amount ₹ (− for outflow)"><NumInput value={e.amount} onChange={(v) => update(e.id, { amount: v })} /></Mini>
            )}

            {e.type === 'purchase' && (
              <div className="grid grid-cols-2 gap-2">
                <Mini label="Asset">
                  <Select
                    value={e.assetClass}
                    options={PURCHASE_CLASSES.map((c) => ({ value: c, label: ASSET_CLASS_LABELS[c] }))}
                    onChange={(v) => update(e.id, { assetClass: v as AssetClassId })}
                  />
                </Mini>
                <Mini label="Price ₹"><NumInput value={e.price} min={0} onChange={(v) => update(e.id, { price: v })} /></Mini>
                <Mini label="Down payment ₹"><NumInput value={e.downPayment} min={0} onChange={(v) => update(e.id, { downPayment: v })} /></Mini>
                <Mini label="Loan amount ₹"><NumInput value={e.loanAmount} min={0} onChange={(v) => update(e.id, { loanAmount: v })} /></Mini>
                <Mini label="EMI ₹/mo"><NumInput value={e.loanMonthlyPayment} min={0} onChange={(v) => update(e.id, { loanMonthlyPayment: v })} /></Mini>
                <Mini label="Loan rate %"><NumInput value={e.loanRatePct} min={0} onChange={(v) => update(e.id, { loanRatePct: v })} /></Mini>
              </div>
            )}
          </div>
        ))}
      </div>

      {events.length > 0 && (
        <p className="flex items-start gap-1.5 text-[11px] nw-text-muted">
          <CalendarClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Timing is relative to the forecast start. Toggle an event off to compare with/without it.
        </p>
      )}
    </div>
  )
}

function Mini({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] nw-text-secondary">{label}</span>
        {hint && <span className="text-[10px] nw-text-muted">{hint}</span>}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function NumInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
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
      className="w-full rounded-lg border nw-hairline bg-white dark:bg-white/5 px-2 py-1 text-sm nw-text-primary tabnums outline-none focus:ring-2 focus:ring-indigo-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border nw-hairline bg-white dark:bg-white/5 px-2 py-1 text-sm nw-text-primary outline-none focus:ring-2 focus:ring-indigo-400/50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
