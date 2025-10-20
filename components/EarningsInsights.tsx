'use client'

import { useState } from 'react'

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
      // Convert month names to numbers for proper sorting
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const aMonth = monthOrder.indexOf(a.monthName) || 0
      const bMonth = monthOrder.indexOf(b.monthName) || 0
      return aMonth - bMonth
    })

    // Filter out incomplete/future months (only include months with meaningful data)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() // 0-11
    
    const completeData = sortedData.filter(record => {
      // If it's a past year, include all months
      if (record.year < currentYear) return true
      
      // If it's current year, only include months up to current month
      if (record.year === currentYear) {
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const recordMonth = monthOrder.indexOf(record.monthName)
        return recordMonth <= currentMonth
      }
      
      // If it's future year, exclude
      return false
    })

    // Also filter out months with zero or very low income (likely incomplete)
    const filteredData = completeData.filter(record => record.income > 1000) // Minimum threshold for complete data

    // Last 6 months analysis (from filtered complete data)
    const last6Months = filteredData.slice(-6)
    const last3Months = filteredData.slice(-3)
    
    // Income growth analysis (only if we have enough data)
    let incomeGrowth = 0
    if (last6Months.length >= 6) {
      const firstPeriod = last6Months.slice(0, 3)
      const secondPeriod = last6Months.slice(3, 6)
      
      const firstPeriodIncome = firstPeriod.reduce((sum, r) => sum + r.income, 0)
      const secondPeriodIncome = secondPeriod.reduce((sum, r) => sum + r.income, 0)
      
      // Debug logging
      console.log('=== Income Growth Calculation Debug ===')
      console.log('Total filtered data length:', filteredData.length)
      console.log('Last 6 months data:', last6Months.map(r => `${r.month} ${r.year}: ₹${r.income.toLocaleString()}`))
      console.log('First 3 months:', firstPeriod.map(r => `${r.month} ${r.year}: ₹${r.income.toLocaleString()}`))
      console.log('Second 3 months:', secondPeriod.map(r => `${r.month} ${r.year}: ₹${r.income.toLocaleString()}`))
      console.log('First period total:', firstPeriodIncome.toLocaleString())
      console.log('Second period total:', secondPeriodIncome.toLocaleString())
      console.log('Calculation: ((', secondPeriodIncome, '-', firstPeriodIncome, ') /', firstPeriodIncome, ') * 100')
      console.log('Raw growth value:', ((secondPeriodIncome - firstPeriodIncome) / firstPeriodIncome))
      console.log('=== End Debug ===')
      
      incomeGrowth = firstPeriodIncome > 0 ? ((secondPeriodIncome - firstPeriodIncome) / firstPeriodIncome) * 100 : 0
      console.log('Growth percentage:', incomeGrowth)
    }

    // Best and worst months (from complete data only)
    const bestMonth = filteredData.reduce((best, current) => 
      (current.income - current.expenditure) > (best.income - best.expenditure) ? current : best
    )
    const worstMonth = filteredData.reduce((worst, current) => 
      (current.income - current.expenditure) < (worst.income - worst.expenditure) ? current : worst
    )

    // Consistency analysis (using filtered data)
    const avgSavingPercent = filteredData.reduce((sum, r) => sum + r.savingPercent, 0) / filteredData.length
    const avgInvestPercent = filteredData.reduce((sum, r) => sum + r.investPercent, 0) / filteredData.length
    
    // Calculate actual average amounts
    const avgSavingAmount = filteredData.reduce((sum, r) => sum + r.saving, 0) / filteredData.length
    const avgInvestAmount = filteredData.reduce((sum, r) => sum + r.invest, 0) / filteredData.length
    
    // Find most consistent saving/investment months
    const consistentSavers = filteredData.filter(r => r.savingPercent > avgSavingPercent * 1.1).length
    const consistentInvestors = filteredData.filter(r => r.investPercent > avgInvestPercent * 1.1).length

    // Financial health score (0-100)
    const avgSavingScore = Math.min((avgSavingPercent / 30) * 40, 40) // Max 40 points for saving %
    const avgInvestScore = Math.min((avgInvestPercent / 50) * 40, 40) // Max 40 points for investment %
    const consistencyScore = ((consistentSavers + consistentInvestors) / (filteredData.length * 2)) * 20 // Max 20 points
    const healthScore = avgSavingScore + avgInvestScore + consistencyScore

    // Recent trend (last 3 months of complete data)
    const recentAvgSaving = last3Months.length > 0 ? last3Months.reduce((sum, r) => sum + r.savingPercent, 0) / last3Months.length : 0
    const recentAvgInvest = last3Months.length > 0 ? last3Months.reduce((sum, r) => sum + r.investPercent, 0) / last3Months.length : 0
    
    // Recent actual amounts based on selected periods
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
      totalMonths: filteredData.length, // Use filtered data count
      hasEnoughData: filteredData.length >= 3, // Minimum for meaningful insights
      incomeGrowthAvailable: last6Months.length >= 6 // Whether we can calculate 6M growth
    }
  }

  // Year-over-year comparison
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Insights</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">No data available for insights</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Financial Health Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Financial Health</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.healthScore.toFixed(0)}/100</p>
            </div>
            <div className={`p-3 rounded-full ${
              insights.healthScore >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
              insights.healthScore >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <span className="text-2xl">
                {insights.healthScore >= 80 ? '🏆' : insights.healthScore >= 60 ? '👍' : '⚠️'}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {insights.healthScore >= 80 ? 'Excellent financial habits' :
             insights.healthScore >= 60 ? 'Good financial management' : 'Room for improvement'}
          </p>
        </div>

        {/* Income Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Income Growth (6M)</p>
              {insights.incomeGrowthAvailable ? (
                <p className={`text-2xl font-bold ${insights.incomeGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {insights.incomeGrowth >= 0 ? '+' : ''}{formatPercent(insights.incomeGrowth)}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">N/A</p>
              )}
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {insights.incomeGrowthAvailable 
              ? "Comparing last 3 months vs previous 3 months (complete data only)"
              : "Need 6+ months of complete data"}
          </p>
        </div>

        {/* Recent Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Saving</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatPercent(insights.recentAvgSaving)}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Last 3 months average
          </p>
        </div>

        {/* Recent Investment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Investment</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatPercent(insights.recentAvgInvest)}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <span className="text-2xl">🚀</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Last 3 months average
          </p>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Performance Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Best Month</span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{insights.bestMonth.month}</div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  +{formatCurrency(insights.bestMonth.income - insights.bestMonth.expenditure)} surplus
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Challenging Month</span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{insights.worstMonth.month}</div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  {formatCurrency(insights.worstMonth.income - insights.worstMonth.expenditure)} surplus
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Consistent Saving Months</span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{insights.consistentSavers}/{insights.totalMonths}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {((insights.consistentSavers / insights.totalMonths) * 100).toFixed(0)}% consistency
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">High Investment Months</span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{insights.consistentInvestors}/{insights.totalMonths}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  {((insights.consistentInvestors / insights.totalMonths) * 100).toFixed(0)}% consistency
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Recent Saving</span>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                  <button
                    onClick={() => setSavingPeriod(3)}
                    className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                      savingPeriod === 3 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    3M
                  </button>
                  <button
                    onClick={() => setSavingPeriod(6)}
                    className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                      savingPeriod === 6 
                        ? 'bg-green-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    6M
                  </button>
                  <button
                    onClick={() => setSavingPeriod(12)}
                    className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                      savingPeriod === 12 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    1Y
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(insights.recentSavingAmount)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Last {savingPeriod === 12 ? '1 year' : `${savingPeriod} months`} total
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Recent Investment</span>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                  <button
                    onClick={() => setInvestmentPeriod(3)}
                    className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                      investmentPeriod === 3 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    3M
                  </button>
                  <button
                    onClick={() => setInvestmentPeriod(6)}
                    className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                      investmentPeriod === 6 
                        ? 'bg-green-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    6M
                  </button>
                  <button
                    onClick={() => setInvestmentPeriod(12)}
                    className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                      investmentPeriod === 12 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    1Y
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(insights.recentInvestAmount)}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Last {investmentPeriod === 12 ? '1 year' : `${investmentPeriod} months`} total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Year-over-Year or Goal Tracking */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {yearComparison ? '📅 Year-over-Year' : '🎯 Financial Goals'}
          </h3>
          
          {yearComparison ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Income Growth</span>
                <div className="text-right">
                  <div className={`text-sm font-medium ${yearComparison.incomeChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {yearComparison.incomeChange >= 0 ? '+' : ''}{formatPercent(yearComparison.incomeChange)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">vs {yearComparison.previousYear}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Saving Growth</span>
                <div className="text-right">
                  <div className={`text-sm font-medium ${yearComparison.savingChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {yearComparison.savingChange >= 0 ? '+' : ''}{formatPercent(yearComparison.savingChange)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">vs {yearComparison.previousYear}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Saving Rate Target</span>
                <div className="text-right">
                  <div className={`text-sm font-medium ${insights.avgSavingPercent >= 30 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {formatPercent(insights.avgSavingPercent)} / 30%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {insights.avgSavingPercent >= 30 ? 'Target achieved!' : 'Keep improving'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Investment Rate Target</span>
                <div className="text-right">
                  <div className={`text-sm font-medium ${insights.avgInvestPercent >= 50 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {formatPercent(insights.avgInvestPercent)} / 50%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {insights.avgInvestPercent >= 50 ? 'Excellent!' : 'Room to grow'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">💡 Insight:</span> 
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