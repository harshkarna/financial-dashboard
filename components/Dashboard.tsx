'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { NetWorthCard, NetWorthInsights } from './NetWorthCard'
import { MonthSelector } from './MonthSelector'
import { AssetBreakdown } from './AssetBreakdown'
import { TrendChart } from './TrendChart'
import { GrowthComparison } from './GrowthComparison'
import { RefreshCw, AlertCircle, LayoutDashboard } from 'lucide-react'

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

  const sheetHeaderToDisplay = (header: string) => {
    const trimmed = header?.toString().trim()
    if (!trimmed) return ''
    if (trimmed.includes('-')) {
      const [monthName, year] = trimmed.split('-')
      const fullYear = year.length === 2 ? `20${year}` : year
      if (monthName === 'July') return `Jul ${fullYear}`
      return `${monthName} ${fullYear}`
    }
    return trimmed
  }

  const fetchMonths = async () => {
    try {
      const response = await fetch('/api/months')
      if (!response.ok) {
        if (response.status === 401) {
          setError('Your Google session expired. Sign out and sign in again to reload the sheet.')
        } else {
          setError('Could not load month list from the sheet. Try again or check your connection.')
        }
        setLoading(false)
        return
      }

      const result = await response.json()
      const list: string[] = Array.isArray(result.months) ? result.months : []

      if (list.length > 0) {
        setMonths(list)
        setSelectedMonth(list[0])
        return
      }

      // Months list empty (e.g. header format mismatch) — still load latest column from sheets API
      const sheetsRes = await fetch('/api/sheets')
      if (sheetsRes.ok) {
        const sheetData = await sheetsRes.json()
        const label = sheetHeaderToDisplay(sheetData.selectedMonth || '')
        if (label) {
          setMonths([label])
          setSelectedMonth(label)
          // Keep loading until fetchData(selectedMonth) runs from useEffect
          return
        }
        setError('No month columns found on the Net Worth tab. Add dated columns after the Item column.')
      } else if (sheetsRes.status === 401) {
        setError('Your Google session expired. Sign out and sign in again.')
      } else {
        setError('No months detected and latest sheet data could not be loaded.')
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching months:', err)
      const fallbackMonths = ['Sep 2025', 'Aug 2025', 'Jul 2025', 'Jun 2025', 'May 2025', 'Apr 2025']
      setMonths(fallbackMonths)
      setSelectedMonth(fallbackMonths[0])
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
        <div className="space-y-6">
          <div className="h-12 bg-slate-700/50 rounded-2xl w-64 animate-pulse" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="h-64 bg-slate-700/50 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-700/50 rounded-2xl animate-pulse" />
          </div>
          
          <div className="h-80 bg-slate-700/50 rounded-2xl animate-pulse" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="h-64 bg-slate-700/50 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-700/50 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-slate-400 mb-6 max-w-md">{error}</p>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              Net Worth Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1 ml-[52px] md:ml-[60px]">
              Track your financial position
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
          <MonthSelector
            months={months}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
        
        {/* Net Worth Card + Insights - Side by side with equal heights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <NetWorthCard 
              netWorth={data?.netWorth || 0}
              month={selectedMonth}
            />
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <NetWorthInsights netWorth={data?.netWorth || 0} />
          </div>
        </div>

        {/* Trend Chart - Full width */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <TrendChart currentMonth={selectedMonth} />
        </div>

        {/* Growth Comparison - Full width */}
        <div className="animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <GrowthComparison />
        </div>
        
        {/* Assets and Liabilities - Side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <AssetBreakdown 
              title="Assets" 
              items={data?.assets || []} 
              type="positive"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
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
