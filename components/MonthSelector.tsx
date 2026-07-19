'use client'

import { Calendar } from 'lucide-react'

interface MonthSelectorProps {
  months: string[]
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export function MonthSelector({ months, selectedMonth, onMonthChange }: MonthSelectorProps) {
  const moreSelected = months.slice(6).includes(selectedMonth)
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 nw-text-muted shrink-0 hidden sm:block" />

      {/* Month Pills - Scrollable on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
        {months.slice(0, 6).map((month) => {
          const isSelected = month === selectedMonth
          return (
            <button
              key={month}
              onClick={() => onMonthChange(month)}
              data-active={isSelected}
              className="nw-control flex-shrink-0 px-3 py-1.5 whitespace-nowrap border nw-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              {month}
            </button>
          )
        })}

        {/* Dropdown for more months */}
        {months.length > 6 && (
          <div className="relative flex-shrink-0">
            <select
              value={moreSelected ? selectedMonth : ''}
              onChange={(e) => e.target.value && onMonthChange(e.target.value)}
              data-active={moreSelected}
              className="nw-control appearance-none pl-3 pr-8 py-1.5 cursor-pointer border nw-hairline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1rem',
              }}
            >
              <option value="">More…</option>
              {months.slice(6).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
