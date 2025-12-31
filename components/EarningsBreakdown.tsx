'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { EarningsInsights } from './EarningsInsights'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  BarChart3,
  RefreshCw,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

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
  const [allData, setAllData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear())
  const [showTable, setShowTable] = useState(true)

  const fetchEarningsData = async (year?: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const allResponse = await fetch('/api/earnings')
      if (allResponse.ok) {
        const allResult = await allResponse.json()
        setAllData(allResult)
      }
      
      const url = year ? `/api/earnings?year=${year}` : '/api/earnings'
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data')
      }
      
      const result = await response.json()
      setData(result)
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
      setSelectedYear(null)
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

  const formatShort = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-64 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 md:h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load earnings data</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{error}</p>
          <button
            onClick={() => fetchEarningsData(selectedYear || undefined)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="text-center text-gray-600 dark:text-gray-400 py-12">No data available</div>
      </div>
    )
  }

  const yearData = data.earnings
  const totalIncome = yearData.reduce((sum, record) => sum + record.income, 0)
  const totalExpenditure = yearData.reduce((sum, record) => sum + record.expenditure, 0)
  const totalSaving = yearData.reduce((sum, record) => sum + record.saving, 0)
  const totalInvest = yearData.reduce((sum, record) => sum + record.invest, 0)
  const avgSavingPercent = totalIncome > 0 ? (totalSaving / totalIncome) * 100 : 0
  const avgInvestPercent = totalIncome > 0 ? (totalInvest / totalIncome) * 100 : 0

  const statCards = [
    {
      title: 'Total Income',
      value: totalIncome,
      icon: Wallet,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      iconBg: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Total Expenditure',
      value: totalExpenditure,
      icon: CreditCard,
      gradient: 'from-red-500 to-rose-500',
      bgGradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      iconBg: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Total Saving',
      value: totalSaving,
      icon: PiggyBank,
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      iconBg: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      subtitle: `${avgSavingPercent.toFixed(1)}% of income`
    },
    {
      title: 'Total Investment',
      value: totalInvest,
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      iconBg: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
      subtitle: `${avgInvestPercent.toFixed(1)}% of income`
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        {/* Header with Year Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Earnings Breakdown
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your income, expenses, and investments
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400 hidden sm:block" />
          <select
            value={selectedYear || ''}
            onChange={(e) => handleYearChange(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1rem'
              }}
          >
            <option value="">All Years</option>
            {data.availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

        {/* Summary Cards - 2x2 on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-2xl p-4 md:p-5 bg-gradient-to-br ${card.bgGradient} border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 float-card`}
              >
                {/* Decorative gradient blob */}
                <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${card.gradient} rounded-full opacity-10 blur-xl`} />
                
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.iconBg} mb-3`}>
                    <Icon className={`w-5 h-5 ${card.textColor}`} />
        </div>

                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                  
                  {/* Show full amount on desktop, short on mobile */}
                  <p className={`text-xl md:text-2xl font-bold ${card.textColor}`}>
                    <span className="md:hidden">{formatShort(card.value)}</span>
                    <span className="hidden md:inline">{formatCurrency(card.value)}</span>
                  </p>
                  
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>
                  )}
            </div>
          </div>
            )
          })}
      </div>

      {/* Financial Insights */}
      <EarningsInsights 
        data={yearData} 
        selectedYear={selectedYear} 
        allData={allData?.earnings || []} 
      />

      {/* Monthly Breakdown Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Breakdown {selectedYear ? `• ${selectedYear}` : '• All Years'}
          </h2>
            {showTable ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showTable && (
            <div className="overflow-x-auto">
              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                {yearData.map((record, index) => (
                  <div key={index} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">{record.month}</span>
                      <div className="flex gap-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          record.savingPercent > 30 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          record.savingPercent > 15 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {record.savingPercent.toFixed(0)}% saved
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Income</span>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatShort(record.income)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Expenses</span>
                        <p className="font-medium text-red-600 dark:text-red-400">{formatShort(record.expenditure)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Saving</span>
                        <p className="font-medium text-blue-600 dark:text-blue-400">{formatShort(record.saving)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Investment</span>
                        <p className="font-medium text-purple-600 dark:text-purple-400">{formatShort(record.invest)}</p>
                      </div>
                    </div>
                  </div>
                ))}
        </div>

              {/* Desktop Table View */}
              <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Income</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expenditure</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saving</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Investment</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saving %</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invest %</th>
              </tr>
            </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {yearData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{record.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(record.income)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium">{formatCurrency(record.expenditure)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(record.saving)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400 font-medium">{formatCurrency(record.invest)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          record.savingPercent > 30 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          record.savingPercent > 15 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {record.savingPercent.toFixed(1)}%
                    </span>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          record.investPercent > 50 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          record.investPercent > 25 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {record.investPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
