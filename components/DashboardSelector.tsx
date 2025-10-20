'use client'

import { Session } from 'next-auth'
import { useTheme } from '@/contexts/ThemeContext'

interface DashboardSelectorProps {
  selectedDashboard: 'networth' | 'earnings' | 'budget'
  onDashboardChange: (dashboard: 'networth' | 'earnings' | 'budget') => void
  session: Session
  onSignOut: () => void
}

export function DashboardSelector({ 
  selectedDashboard, 
  onDashboardChange, 
  session, 
  onSignOut 
}: DashboardSelectorProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="text-blue-600 dark:text-blue-400 font-bold text-xl mr-8">📊 Financial Dashboard</div>
            
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => onDashboardChange('networth')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDashboard === 'networth'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                💰 Net Worth Tracker
              </button>
              <button
                onClick={() => onDashboardChange('earnings')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDashboard === 'earnings'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📈 Earnings Breakdown
              </button>
              <button
                onClick={() => onDashboardChange('budget')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDashboard === 'budget'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                💳 Monthly Budget
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <div className="flex items-center space-x-2">
              <img
                src={session.user?.image || ''}
                alt={session.user?.name || ''}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{session.user?.name}</span>
            </div>
            <button
              onClick={onSignOut}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}