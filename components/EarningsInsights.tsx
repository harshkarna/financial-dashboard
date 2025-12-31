'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Target, Zap, Award, BarChart3 } from 'lucide-react'

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

interface EarningsInsightsProps {
  data: EarningRecord[]
  selectedYear: number | null
  allData: EarningRecord[]
}

export function EarningsInsights({ data, selectedYear, allData }: EarningsInsightsProps) {
  const [savingPeriod, setSavingPeriod] = useState<3 | 6 | 12>(3)
  const [investmentPeriod, setInvestmentPeriod] = useState<3 | 6 | 12>(6)

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`
    }
    return `₹${amount.toLocaleString()}`
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  // Calculate insights
  const calculateInsights = () => {
    if (!data || data.length === 0) return null

    // Sort by year and month for chronological analysis
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const aMonth = monthOrder.indexOf(a.monthName) || 0
      const bMonth = monthOrder.indexOf(b.monthName) || 0
      return aMonth - bMonth
    })

    // Filter out incomplete/future months
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    const completeData = sortedData.filter(record => {
      if (record.year < currentYear) return true
      if (record.year === currentYear) {
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const recordMonth = monthOrder.indexOf(record.monthName)
        return recordMonth <= currentMonth
      }
      return false
    })

    const filteredData = completeData.filter(record => record.income > 1000)

    if (filteredData.length === 0) return null

    const last6Months = filteredData.slice(-6)
    const last3Months = filteredData.slice(-3)
    
    let incomeGrowth = 0
    if (last6Months.length >= 6) {
      const firstPeriod = last6Months.slice(0, 3)
      const secondPeriod = last6Months.slice(3, 6)
      const firstPeriodIncome = firstPeriod.reduce((sum, r) => sum + r.income, 0)
      const secondPeriodIncome = secondPeriod.reduce((sum, r) => sum + r.income, 0)
      incomeGrowth = firstPeriodIncome > 0 ? ((secondPeriodIncome - firstPeriodIncome) / firstPeriodIncome) * 100 : 0
    }

    const bestMonth = filteredData.reduce((best, current) => 
      (current.income - current.expenditure) > (best.income - best.expenditure) ? current : best,
      filteredData[0]
    )
    const worstMonth = filteredData.reduce((worst, current) => 
      (current.income - current.expenditure) < (worst.income - worst.expenditure) ? current : worst,
      filteredData[0]
    )

    const avgSavingPercent = filteredData.reduce((sum, r) => sum + r.savingPercent, 0) / filteredData.length
    const avgInvestPercent = filteredData.reduce((sum, r) => sum + r.investPercent, 0) / filteredData.length
    const avgSavingAmount = filteredData.reduce((sum, r) => sum + r.saving, 0) / filteredData.length
    const avgInvestAmount = filteredData.reduce((sum, r) => sum + r.invest, 0) / filteredData.length
    
    const consistentSavers = filteredData.filter(r => r.savingPercent > avgSavingPercent * 1.1).length
    const consistentInvestors = filteredData.filter(r => r.investPercent > avgInvestPercent * 1.1).length

    const avgSavingScore = Math.min((avgSavingPercent / 30) * 40, 40)
    const avgInvestScore = Math.min((avgInvestPercent / 50) * 40, 40)
    const consistencyScore = ((consistentSavers + consistentInvestors) / (filteredData.length * 2)) * 20
    const healthScore = avgSavingScore + avgInvestScore + consistencyScore

    const recentAvgSaving = last3Months.length > 0 ? last3Months.reduce((sum, r) => sum + r.savingPercent, 0) / last3Months.length : 0
    const recentAvgInvest = last3Months.length > 0 ? last3Months.reduce((sum, r) => sum + r.investPercent, 0) / last3Months.length : 0
    
    const savingMonths = filteredData.slice(-savingPeriod)
    const investmentMonths = filteredData.slice(-investmentPeriod)
    const recentSavingAmount = savingMonths.reduce((sum, r) => sum + r.saving, 0)
    const recentInvestAmount = investmentMonths.reduce((sum, r) => sum + r.invest, 0)
    
    return {
      incomeGrowth,
      bestMonth,
      worstMonth,
      avgSavingPercent,
      avgInvestPercent,
      avgSavingAmount,
      avgInvestAmount,
      healthScore,
      consistentSavers,
      consistentInvestors,
      recentAvgSaving,
      recentAvgInvest,
      recentSavingAmount,
      recentInvestAmount,
      last6Months,
      totalMonths: filteredData.length,
      hasEnoughData: filteredData.length >= 3,
      incomeGrowthAvailable: last6Months.length >= 6
    }
  }

  const getYearComparison = () => {
    if (!selectedYear || selectedYear === 2025) return null

    const currentYearData = allData.filter(r => r.year === selectedYear)
    const previousYearData = allData.filter(r => r.year === selectedYear - 1)

    if (currentYearData.length === 0 || previousYearData.length === 0) return null

    const currentIncome = currentYearData.reduce((sum, r) => sum + r.income, 0)
    const previousIncome = previousYearData.reduce((sum, r) => sum + r.income, 0)
    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0

    const currentSaving = currentYearData.reduce((sum, r) => sum + r.saving, 0)
    const previousSaving = previousYearData.reduce((sum, r) => sum + r.saving, 0)
    const savingChange = previousSaving > 0 ? ((currentSaving - previousSaving) / previousSaving) * 100 : 0

    return { incomeChange, savingChange, previousYear: selectedYear - 1 }
  }

  const insights = calculateInsights()
  const yearComparison = getYearComparison()

  if (!insights) {
    return (
      <div className="glass-dark rounded-2xl p-6 glow-purple">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Financial Insights</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-slate-300 text-lg font-medium">No complete data available</p>
          <p className="text-slate-500 text-sm mt-2">
            {selectedYear && selectedYear > new Date().getFullYear() 
              ? `Data for ${selectedYear} will appear as months complete`
              : 'Add more earnings data to see insights'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Financial Health Score */}
        <div className="glass-dark rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              insights.healthScore >= 80 ? 'bg-emerald-500/20 border border-emerald-500/30' :
              insights.healthScore >= 60 ? 'bg-amber-500/20 border border-amber-500/30' : 
              'bg-red-500/20 border border-red-500/30'
            }`}>
              <span className="text-2xl">
                {insights.healthScore >= 80 ? '🏆' : insights.healthScore >= 60 ? '👍' : '⚠️'}
              </span>
            </div>
          </div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Financial Health</p>
          <p className="text-3xl font-black text-white">{insights.healthScore.toFixed(0)}<span className="text-lg text-slate-500">/100</span></p>
          <p className="text-xs text-slate-500 mt-1">
            {insights.healthScore >= 80 ? 'Excellent habits' :
             insights.healthScore >= 60 ? 'Good management' : 'Room to improve'}
          </p>
        </div>

        {/* Income Growth */}
        <div className="glass-dark rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
              {insights.incomeGrowth >= 0 ? (
                <TrendingUp className="h-6 w-6 text-blue-400" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-400" />
              )}
            </div>
          </div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Income Growth (6M)</p>
          {insights.incomeGrowthAvailable ? (
            <p className={`text-3xl font-black ${insights.incomeGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {insights.incomeGrowth >= 0 ? '+' : ''}{formatPercent(insights.incomeGrowth)}
            </p>
          ) : (
            <p className="text-3xl font-black text-slate-500">N/A</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {insights.incomeGrowthAvailable ? "3M vs previous 3M" : "Need 6+ months"}
          </p>
        </div>

        {/* Recent Saving */}
        <div className="glass-dark rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Recent Saving</p>
          <p className="text-3xl font-black text-cyan-400">{formatPercent(insights.recentAvgSaving)}</p>
          <p className="text-xs text-slate-500 mt-1">Last 3 months avg</p>
        </div>

        {/* Recent Investment */}
        <div className="glass-dark rounded-2xl p-5 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Recent Investment</p>
          <p className="text-3xl font-black text-purple-400">{formatPercent(insights.recentAvgInvest)}</p>
          <p className="text-xs text-slate-500 mt-1">Last 3 months avg</p>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Analysis */}
        <div className="glass-dark rounded-2xl p-5 glow-cyan">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Award className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Performance Analysis</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Best Month</span>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{insights.bestMonth.month}</div>
                <div className="text-xs text-emerald-400">
                  +{formatCurrency(insights.bestMonth.income - insights.bestMonth.expenditure)} surplus
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Challenging Month</span>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{insights.worstMonth.month}</div>
                <div className="text-xs text-red-400">
                  {formatCurrency(insights.worstMonth.income - insights.worstMonth.expenditure)} surplus
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Consistent Saving</span>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{insights.consistentSavers}/{insights.totalMonths}</div>
                <div className="text-xs text-blue-400">
                  {((insights.consistentSavers / insights.totalMonths) * 100).toFixed(0)}% consistency
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Recent Saving</span>
                <div className="flex items-center gap-1 bg-slate-700/50 rounded-full p-0.5">
                  {[3, 6, 12].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSavingPeriod(period as 3 | 6 | 12)}
                      className={`px-2 py-0.5 text-xs rounded-full transition-all ${
                        savingPeriod === period 
                          ? 'bg-blue-500 text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {period === 12 ? '1Y' : `${period}M`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{formatCurrency(insights.recentSavingAmount)}</div>
                <div className="text-xs text-emerald-400">
                  Last {savingPeriod === 12 ? '1 year' : `${savingPeriod} months`}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Recent Investment</span>
                <div className="flex items-center gap-1 bg-slate-700/50 rounded-full p-0.5">
                  {[3, 6, 12].map((period) => (
                    <button
                      key={period}
                      onClick={() => setInvestmentPeriod(period as 3 | 6 | 12)}
                      className={`px-2 py-0.5 text-xs rounded-full transition-all ${
                        investmentPeriod === period 
                          ? 'bg-purple-500 text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {period === 12 ? '1Y' : `${period}M`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{formatCurrency(insights.recentInvestAmount)}</div>
                <div className="text-xs text-purple-400">
                  Last {investmentPeriod === 12 ? '1 year' : `${investmentPeriod} months`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Year-over-Year or Goal Tracking */}
        <div className="glass-dark rounded-2xl p-5 glow-amber">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {yearComparison ? 'Year-over-Year' : 'Financial Goals'}
            </h3>
          </div>
          
          {yearComparison ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">Income Growth</span>
                <div className="text-right">
                  <div className={`text-sm font-bold ${yearComparison.incomeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {yearComparison.incomeChange >= 0 ? '+' : ''}{formatPercent(yearComparison.incomeChange)}
                  </div>
                  <div className="text-xs text-slate-500">vs {yearComparison.previousYear}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">Saving Growth</span>
                <div className="text-right">
                  <div className={`text-sm font-bold ${yearComparison.savingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {yearComparison.savingChange >= 0 ? '+' : ''}{formatPercent(yearComparison.savingChange)}
                  </div>
                  <div className="text-xs text-slate-500">vs {yearComparison.previousYear}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">Saving Rate Target</span>
                <div className="text-right">
                  <div className={`text-sm font-bold ${insights.avgSavingPercent >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatPercent(insights.avgSavingPercent)} / 30%
                  </div>
                  <div className="text-xs text-slate-500">
                    {insights.avgSavingPercent >= 30 ? 'Target achieved!' : 'Keep improving'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">Investment Rate Target</span>
                <div className="text-right">
                  <div className={`text-sm font-bold ${insights.avgInvestPercent >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatPercent(insights.avgInvestPercent)} / 50%
                  </div>
                  <div className="text-xs text-slate-500">
                    {insights.avgInvestPercent >= 50 ? 'Excellent!' : 'Room to grow'}
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Saving Progress</span>
                    <span>{Math.min((insights.avgSavingPercent / 30) * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((insights.avgSavingPercent / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Investment Progress</span>
                    <span>{Math.min((insights.avgInvestPercent / 50) * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((insights.avgInvestPercent / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl p-4 mt-4 border border-amber-500/20">
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-amber-400">💡 Insight:</span> 
                  {insights.avgSavingPercent < 20 
                    ? " Focus on reducing expenses to increase your saving rate."
                    : insights.avgInvestPercent < 30
                    ? " Great saving habits! Consider increasing your investment allocation."
                    : " Excellent financial management! You're on track for strong wealth building."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
