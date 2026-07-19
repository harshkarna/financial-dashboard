'use client'

import { CalendarClock, Plus, Briefcase, GraduationCap, TrendingDown, Coins, Home } from 'lucide-react'
import { ScenarioEvent, ScenarioEventType } from '@/lib/forecast/types'
import { describeEvent, eventDateLabel } from '@/lib/forecast/events'

interface EventsTimelineProps {
  events: ScenarioEvent[]
  startDate: { month: number; year: number }
  onEdit: () => void
  onToggle: (id: string, enabled: boolean) => void
}

const ICONS: Record<ScenarioEventType, React.ComponentType<{ className?: string }>> = {
  jobSwitch: Briefcase,
  pluralsightChange: GraduationCap,
  expenseChange: TrendingDown,
  cashflow: Coins,
  purchase: Home,
}

export function EventsTimeline({ events, startDate, onEdit, onToggle }: EventsTimelineProps) {
  const sorted = [...events].sort((a, b) => a.monthOffset - b.monthOffset)

  return (
    <section className="nw-card p-5" aria-label="Life events">
      <div className="flex items-center gap-2.5 mb-4">
        <CalendarClock className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-base font-semibold nw-text-primary">Life Events</h2>
        <button
          onClick={onEdit}
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium nw-control"
        >
          <Plus className="w-3.5 h-3.5" />
          {events.length ? 'Edit' : 'Add event'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm nw-text-secondary">
          Model decisions like a job switch, a career break, Pluralsight winding down, a home or car
          purchase, or a windfall — and watch the projection respond.
        </p>
      ) : (
        <ol className="relative border-l-2 nw-hairline ml-1.5 space-y-4">
          {sorted.map((e) => {
            const Icon = ICONS[e.type]
            return (
              <li key={e.id} className="ml-4">
                <span
                  className={`absolute -left-[9px] grid place-items-center w-4 h-4 rounded-full ring-4 ring-white dark:ring-[#0f131a] ${
                    e.enabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <div className="flex items-start gap-3">
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${e.enabled ? 'nw-text-primary' : 'nw-text-muted line-through'}`}>
                        {e.label}
                      </p>
                      <span className="text-[11px] nw-text-muted whitespace-nowrap">
                        {eventDateLabel(startDate, e.monthOffset)}
                      </span>
                      <label className="ml-auto inline-flex items-center gap-1 text-[11px] nw-text-muted">
                        <input
                          type="checkbox"
                          checked={e.enabled}
                          onChange={(ev) => onToggle(e.id, ev.target.checked)}
                          className="accent-indigo-600"
                        />
                        On
                      </label>
                    </div>
                    <p className="text-xs nw-text-secondary mt-0.5">{describeEvent(e)}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
