'use client'

import { Calendar } from 'lucide-react'

interface MonthSelectorProps {
  months: string[]
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export function MonthSelector({ months, selectedMonth, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
          Select Month
        </span>
      </div>
      
      {/* Month Pills - Scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
        {months.slice(0, 6).map((month) => {
          const isSelected = month === selectedMonth
          return (
            <button
              key={month}
              onClick={() => onMonthChange(month)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${isSelected 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }
              `}
            >
              {month}
            </button>
          )
        })}
        
        {/* Dropdown for more months */}
        {months.length > 6 && (
          <div className="relative flex-shrink-0">
            <select
              value={months.slice(6).includes(selectedMonth) ? selectedMonth : ''}
              onChange={(e) => e.target.value && onMonthChange(e.target.value)}
              className={`
                appearance-none pl-4 pr-8 py-2 rounded-xl text-sm font-medium cursor-pointer
                transition-all duration-200
                ${months.slice(6).includes(selectedMonth)
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${months.slice(6).includes(selectedMonth) ? '%23ffffff' : '%236B7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1rem'
              }}
            >
              <option value="" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                More...
              </option>
              {months.slice(6).map((month) => (
                <option key={month} value={month} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
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
