'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { NetWorthCard } from './NetWorthCard'
import { MonthSelector } from './MonthSelector'
import { AssetBreakdown } from './AssetBreakdown'
import { TrendChart } from './TrendChart'
import { Header } from './Header'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchData(selectedMonth)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <MonthSelector
            months={months}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <NetWorthCard 
              netWorth={data?.netWorth || 0}
              month={selectedMonth}
            />
          </div>
          
          <div className="lg:col-span-2">
            <TrendChart currentMonth={selectedMonth} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetBreakdown 
            title="Assets" 
            items={data?.assets || []} 
            type="positive"
          />
          <AssetBreakdown 
            title="Liabilities" 
            items={data?.liabilities || []} 
            type="negative"
          />
        </div>
    </div>
  )
}