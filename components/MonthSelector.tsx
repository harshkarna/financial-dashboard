'use client'

import { ChevronDown } from 'lucide-react'

interface MonthSelectorProps {
  months: string[]
  selectedMonth: string
  onMonthChange: (month: string) => void
}

export function MonthSelector({ months, selectedMonth, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center space-x-4">
      <label htmlFor="month-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Month:
      </label>
      
      <div className="relative">
        <select
          id="month-select"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        >
          {months.map((month) => (
            <option key={month} value={month} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {month}
            </option>
          ))}
        </select>
        
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-300 pointer-events-none" />
      </div>
    </div>
  )
}