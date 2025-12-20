'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { NetWorthCard } from './NetWorthCard'
import { MonthSelector } from './MonthSelector'
import { AssetBreakdown } from './AssetBreakdown'
import { TrendChart } from './TrendChart'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface DashboardProps {
  session: Session
  onSignOut: () => void
}

interface NetWorthData {
  netWorth: number
  assets: Array<{
    category: string
    type: string
    item: string
    amount: number
  }>
  liabilities: Array<{
    category: string
    type: string
    item: string
    amount: number
  }>
}

export function Dashboard({ session, onSignOut }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState('')
  const [data, setData] = useState<NetWorthData | null>(null)
  const [months, setMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMonths()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchData(selectedMonth)
    }
  }, [selectedMonth])

  const fetchMonths = async () => {
    try {
      const response = await fetch('/api/months')
      if (response.ok) {
        const result = await response.json()
        setMonths(result.months)
        // Set the most recent month as default
        if (result.months.length > 0) {
          setSelectedMonth(result.months[0])
        }
      }
    } catch (err) {
      console.error('Error fetching months:', err)
      // Fallback to default months (most recent first)
      const fallbackMonths = ['Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025', 'May 2025', 'Apr 2025']
      setMonths(fallbackMonths)
      setSelectedMonth(fallbackMonths[0]) // Set most recent as default
    }
  }

  const fetchData = async (month: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/sheets?month=${encodeURIComponent(month)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('Failed to load data. Please try again.')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="stagger-children space-y-6">
          {/* Loading skeleton */}
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl w-48 animate-pulse" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-1">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{error}</p>
          <button 
            onClick={() => fetchData(selectedMonth)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        {/* Month Selector - Scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
          <MonthSelector
            months={months}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Net Worth Card - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <NetWorthCard 
              netWorth={data?.netWorth || 0}
              month={selectedMonth}
            />
          </div>
          
          {/* Trend Chart - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <TrendChart currentMonth={selectedMonth} />
          </div>
        </div>
        
        {/* Assets and Liabilities - Stack on mobile, side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <AssetBreakdown 
              title="Assets" 
              items={data?.assets || []} 
              type="positive"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <AssetBreakdown 
              title="Liabilities" 
              items={data?.liabilities || []} 
              type="negative"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
