'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { EarningsInsights } from './EarningsInsights'

interface EarningRecord {
  month: string
  monthName: string
  year: number
  income: number
  expenditure: number
  saving: number
  invest: number
  savingPercent: number
  investPercent: number
}

interface EarningsData {
  earnings: EarningRecord[]
  availableYears: number[]
  totalRecords: number
}

interface EarningsBreakdownProps {
  session: Session
  onSignOut: () => void
}

export function EarningsBreakdown({ session }: EarningsBreakdownProps) {
  const [data, setData] = useState<EarningsData | null>(null)
  const [allData, setAllData] = useState<EarningsData | null>(null) // Store all years data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear())

  const fetchEarningsData = async (year?: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Always fetch all data first (for insights and comparison)
      const allResponse = await fetch('/api/earnings')
      if (allResponse.ok) {
        const allResult = await allResponse.json()
        setAllData(allResult)
      }
      
      // Fetch specific year data
      const url = year ? `/api/earnings?year=${year}` : '/api/earnings'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data')
      }
      
      const result = await response.json()
      setData(result)
      
      // Default to current year on initial load
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEarningsData(selectedYear || undefined)
  }, [selectedYear])

  const handleYearChange = (value: string) => {
    if (value === '') {
      setSelectedYear(null) // This means "All Years"
    } else {
      setSelectedYear(parseInt(value))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">Failed to load earnings data</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchEarningsData(selectedYear || undefined)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center text-gray-600 dark:text-gray-400 py-8">No data available</div>
  }

  // Calculate summary statistics for selected year
  const yearData = data.earnings
  const totalIncome = yearData.reduce((sum, record) => sum + record.income, 0)
  const totalExpenditure = yearData.reduce((sum, record) => sum + record.expenditure, 0)
  const totalSaving = yearData.reduce((sum, record) => sum + record.saving, 0)
  const totalInvest = yearData.reduce((sum, record) => sum + record.invest, 0)
  
  // Fix aggregation: calculate percentages based on totals, not averages
  const avgSavingPercent = totalIncome > 0 ? (totalSaving / totalIncome) * 100 : 0
  const avgInvestPercent = totalIncome > 0 ? (totalInvest / totalIncome) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Year Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings Breakdown</h1>
          <select
            value={selectedYear || ''}
            onChange={(e) => handleYearChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <option value="">All Years</option>
            {data.availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-green-600 dark:text-green-400 text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <span className="text-red-600 dark:text-red-400 text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenditure</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenditure)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 text-2xl">🏦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Saving</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSaving)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{avgSavingPercent.toFixed(1)}% avg</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalInvest)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{avgInvestPercent.toFixed(1)}% avg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      <EarningsInsights 
        data={yearData} 
        selectedYear={selectedYear} 
        allData={allData?.earnings || []} 
      />

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Breakdown {selectedYear ? `- ${selectedYear}` : '(All Years)'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expenditure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Saving
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Saving %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Investment %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {yearData.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {record.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatCurrency(record.income)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatCurrency(record.expenditure)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatCurrency(record.saving)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatCurrency(record.invest)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.savingPercent > 30 ? 'bg-green-100 text-green-800' :
                      record.savingPercent > 15 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.savingPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.investPercent > 50 ? 'bg-purple-100 text-purple-800' :
                      record.investPercent > 25 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.investPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}