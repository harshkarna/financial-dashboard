'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface NetWorthCardProps {
  netWorth: number
  month: string
}

export function NetWorthCard({ netWorth, month }: NetWorthCardProps) {
  const isPositive = netWorth >= 0
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(netWorth))

  return (
    <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-6 border border-green-100 dark:border-gray-600 transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Net Worth</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current financial position</p>
        </div>
        <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{month}</p>
          <p className={`text-4xl font-bold ${
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {!isPositive && '-'}{formattedAmount}
          </p>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-IN')}
          </p>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {isPositive ? 'Positive' : 'Negative'}
          </div>
        </div>
      </div>
    </div>
  )
}