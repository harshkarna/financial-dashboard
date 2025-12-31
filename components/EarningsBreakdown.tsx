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
          <div className="h-10 bg-slate-700/50 rounded-xl w-64 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-700/50 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-slate-700/50 rounded-2xl animate-pulse" />
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
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load earnings data</h3>
          <p className="text-slate-400 mb-6 max-w-md">{error}</p>
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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-slate-400 text-lg">No data available</p>
        </div>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-6">
        {/* Header with Year Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              Earnings Breakdown
            </h1>
            <p className="text-sm text-slate-400 mt-1 ml-[52px] md:ml-[60px]">
              Track your income, expenses, and investments
            </p>
          </div>
          
          <select
            value={selectedYear || ''}
            onChange={(e) => handleYearChange(e.target.value)}
            className="appearance-none bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl border border-slate-600 focus:outline-none focus:border-emerald-500 font-medium min-w-[120px]"
          >
            <option value="">All Years</option>
            {data.availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Summary Cards - Premium Dark Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-900/50 to-green-900/40 rounded-2xl p-5 border border-emerald-500/30 glow-green hover-lift card-shine">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <p className="text-emerald-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Total Income</p>
              <p className="text-2xl md:text-3xl font-black text-white">
                <span className="md:hidden">{formatShort(totalIncome)}</span>
                <span className="hidden md:inline">{formatCurrency(totalIncome)}</span>
              </p>
            </div>
          </div>

          {/* Expenditure Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-red-900/50 to-rose-900/40 rounded-2xl p-5 border border-red-500/30 glow-red hover-lift card-shine">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-colors"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-red-500/30">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <p className="text-red-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Expenditure</p>
              <p className="text-2xl md:text-3xl font-black text-white">
                <span className="md:hidden">{formatShort(totalExpenditure)}</span>
                <span className="hidden md:inline">{formatCurrency(totalExpenditure)}</span>
              </p>
            </div>
          </div>

          {/* Saving Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-cyan-900/40 rounded-2xl p-5 border border-blue-500/30 glow-blue hover-lift card-shine">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                <PiggyBank className="h-5 w-5 text-white" />
              </div>
              <p className="text-blue-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Total Saving</p>
              <p className="text-2xl md:text-3xl font-black text-white">
                <span className="md:hidden">{formatShort(totalSaving)}</span>
                <span className="hidden md:inline">{formatCurrency(totalSaving)}</span>
              </p>
              <p className="text-xs text-blue-400/70 mt-1">{avgSavingPercent.toFixed(1)}% of income</p>
            </div>
          </div>

          {/* Investment Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/40 rounded-2xl p-5 border border-purple-500/30 glow-purple hover-lift card-shine">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <p className="text-purple-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Investment</p>
              <p className="text-2xl md:text-3xl font-black text-white">
                <span className="md:hidden">{formatShort(totalInvest)}</span>
                <span className="hidden md:inline">{formatCurrency(totalInvest)}</span>
              </p>
              <p className="text-xs text-purple-400/70 mt-1">{avgInvestPercent.toFixed(1)}% of income</p>
            </div>
          </div>
        </div>

        {/* Financial Insights */}
        <EarningsInsights 
          data={yearData} 
          selectedYear={selectedYear} 
          allData={allData?.earnings || []} 
        />

        {/* Monthly Breakdown Table - Premium Dark Style */}
        <div className="glass-dark rounded-2xl glow-blue overflow-hidden">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Monthly Breakdown {selectedYear ? `• ${selectedYear}` : '• All Years'}
              </h2>
            </div>
            {showTable ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {showTable && (
            <div className="overflow-x-auto">
              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-slate-700/50">
                {yearData.map((record, index) => (
                  <div key={index} className="p-4 space-y-3 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{record.month}</span>
                      <div className="flex gap-2">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                          record.savingPercent > 30 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          record.savingPercent > 15 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {record.savingPercent.toFixed(0)}% saved
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-emerald-900/20 rounded-lg p-2 border border-emerald-500/20">
                        <span className="text-emerald-400/70 text-xs">Income</span>
                        <p className="font-bold text-emerald-400">{formatShort(record.income)}</p>
                      </div>
                      <div className="bg-red-900/20 rounded-lg p-2 border border-red-500/20">
                        <span className="text-red-400/70 text-xs">Expenses</span>
                        <p className="font-bold text-red-400">{formatShort(record.expenditure)}</p>
                      </div>
                      <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                        <span className="text-blue-400/70 text-xs">Saving</span>
                        <p className="font-bold text-blue-400">{formatShort(record.saving)}</p>
                      </div>
                      <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/20">
                        <span className="text-purple-400/70 text-xs">Investment</span>
                        <p className="font-bold text-purple-400">{formatShort(record.invest)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <table className="hidden md:table min-w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Income</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Expenditure</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Saving</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Investment</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Saving %</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Invest %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {yearData.map((record, index) => (
                    <tr key={index} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{record.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">{formatCurrency(record.income)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400">{formatCurrency(record.expenditure)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-400">{formatCurrency(record.saving)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-400">{formatCurrency(record.invest)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          record.savingPercent > 30 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          record.savingPercent > 15 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {record.savingPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          record.investPercent > 50 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          record.investPercent > 25 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-slate-500/20 text-slate-400 border border-slate-500/30'
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
