/**
 * Helpers for creating, describing, and dating scenario events (Phase 2).
 * Kept separate from the engine so UI code can build/label events without
 * pulling in the projection maths.
 */

import { addMonths } from './engine'
import { formatCompactINR } from '@/lib/format'
import { AssetClassId, ScenarioEvent, ScenarioEventType, SCENARIO_EVENT_LABELS } from './types'

let seq = 0
function nextId(): string {
  seq += 1
  return `evt-${Date.now().toString(36)}-${seq}`
}

/** Build a new event of the given type with sensible starting values. */
export function makeEvent(type: ScenarioEventType, monthOffset = 12): ScenarioEvent {
  const common = { id: nextId(), enabled: true, monthOffset, label: SCENARIO_EVENT_LABELS[type] }
  switch (type) {
    case 'jobSwitch':
      return {
        ...common,
        type,
        salaryHikePct: 25,
        newAnnualRsu: null,
        joiningBonus: 0,
        monthsWithoutSalary: 0,
        expenseChangePct: 0,
      }
    case 'pluralsightChange':
      return { ...common, type, action: 'shutdown', value: 0, durationMonths: 0 }
    case 'expenseChange':
      return { ...common, type, changePct: 20 }
    case 'cashflow':
      return { ...common, type, amount: 500_000 }
    case 'purchase':
      return {
        ...common,
        type,
        assetClass: 'realEstate',
        price: 15_000_000,
        downPayment: 3_000_000,
        loanAmount: 12_000_000,
        loanMonthlyPayment: 110_000,
        loanRatePct: 8.5,
      }
  }
}

/** The month/year an event lands on, given the forecast start. */
export function eventDateLabel(
  startDate: { month: number; year: number },
  monthOffset: number,
): string {
  return addMonths(startDate, monthOffset + 1).label
}

/** A short, human-readable summary of what an event does. */
export function describeEvent(e: ScenarioEvent): string {
  switch (e.type) {
    case 'jobSwitch': {
      const parts: string[] = []
      if (e.salaryHikePct) parts.push(`${e.salaryHikePct > 0 ? '+' : ''}${e.salaryHikePct}% salary`)
      if (e.newAnnualRsu !== null) parts.push(`RSU → ${formatCompactINR(e.newAnnualRsu)}/yr`)
      if (e.joiningBonus) parts.push(`${formatCompactINR(e.joiningBonus)} joining`)
      if (e.monthsWithoutSalary) parts.push(`${e.monthsWithoutSalary}m break`)
      if (e.expenseChangePct) parts.push(`${e.expenseChangePct > 0 ? '+' : ''}${e.expenseChangePct}% spend`)
      return parts.length ? parts.join(' · ') : 'No change'
    }
    case 'pluralsightChange': {
      const dur = e.durationMonths > 0 ? ` for ${e.durationMonths}m` : ''
      if (e.action === 'shutdown') return `Pluralsight stops${dur}`
      if (e.action === 'setMonthly') return `Pluralsight → ${formatCompactINR(e.value)}/mo${dur}`
      return `Pluralsight ×${e.value}${dur}`
    }
    case 'expenseChange':
      return `${e.changePct > 0 ? '+' : ''}${e.changePct}% monthly spend`
    case 'cashflow':
      return `${e.amount >= 0 ? '+' : '−'}${formatCompactINR(Math.abs(e.amount))} one-off`
    case 'purchase':
      return `${formatCompactINR(e.price)} ${ASSET_LABEL[e.assetClass] ?? e.assetClass} · ${formatCompactINR(e.loanAmount)} loan`
  }
}

const ASSET_LABEL: Partial<Record<AssetClassId, string>> = {
  realEstate: 'home',
  vehicle: 'vehicle',
  gold: 'gold',
  stocks: 'stocks',
  other: 'asset',
}

export { SCENARIO_EVENT_LABELS }
