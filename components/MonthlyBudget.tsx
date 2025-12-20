'use client'

import { useState, useEffect } from 'react'
// Simple Card components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`} onClick={onClick}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
    {children}
  </h3>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  CreditCard,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ExpenseItem {
  month: string
  category: string
  breakdown: string
  amount: number
  year?: number
}

interface IncomeItem {
  month: string
  incomeSource1: number
  incomeSource2: number
  otherIncome: number
  otherTaxDeduction: number
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  year?: number
}

interface BudgetData {
  expenses: ExpenseItem[]
  income: IncomeItem[]
  summary: {
    topCategories: { category: string; amount: number }[]
    totalIncome: number
    totalExpenses: number
    totalSavings: number
    savingsRate: number
    monthlyTrends: {
      month: string
      income: number
      expenses: number
      savings: number
      savingsRate: number
    }[]
    categoryTotals: { [key: string]: number }
    taxDeductions: {
      total: number
      fromApr: number
      monthlyBreakdown: { month: string; amount: number }[]
      fiscalYear?: string
    }
  }
  availableMonths: string[]
  availableYears: number[]
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
]

export function MonthlyBudget() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  // Default to current year
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [initialYearSet, setInitialYearSet] = useState(false)

  useEffect(() => {
    fetchBudgetData()
  }, [selectedMonth, selectedYear])

  // Set year to most recent available year ONLY on first load
  useEffect(() => {
    if (!initialYearSet && budgetData?.availableYears && budgetData.availableYears.length > 0) {
      const currentYear = new Date().getFullYear()
      // If current year is available, use it; otherwise use most recent
      if (budgetData.availableYears.includes(currentYear)) {
        setSelectedYear(currentYear.toString())
      } else {
        // Use most recent available year
        setSelectedYear(budgetData.availableYears[0].toString())
      }
      setInitialYearSet(true) // Mark as initialized so this doesn't run again
    }
  }, [budgetData?.availableYears, initialYearSet])

  const fetchBudgetData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedMonth !== 'all') params.append('month', selectedMonth)
      // Always pass year (no "all" option anymore)
      params.append('year', selectedYear)
      
      const queryString = params.toString()
      const response = await fetch(`/api/budget${queryString ? `?${queryString}` : ''}`)
      if (!response.ok) throw new Error('Failed to fetch budget data')
      const data = await response.json()
      setBudgetData(data)
    } catch (error) {
      console.error('Error fetching budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatShortCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount}`
  }

  // Generate creative insights based on categories and breakdowns
  const generateInsights = () => {
    if (!budgetData) return []

    const insights: { icon: string; title: string; description: string }[] = []
    const { summary, expenses } = budgetData

    // Helper to find expenses by breakdown keywords
    const findExpensesByKeywords = (keywords: string[]) => {
      return expenses.filter(exp => 
        keywords.some(kw => 
          exp.breakdown?.toLowerCase().includes(kw.toLowerCase()) ||
          exp.category?.toLowerCase().includes(kw.toLowerCase())
        )
      )
    }

    // Helper to sum expenses
    const sumExpenses = (items: ExpenseItem[]) => items.reduce((sum, e) => sum + e.amount, 0)

    // 1. Subscription Tracker (ChatGPT, AWS, Netflix, OTT, etc.)
    const subscriptionKeywords = ['chatgpt', 'aws', 'netflix', 'ott', 'subscription', 'subs', 'prime', 'spotify', 'youtube']
    const subscriptions = findExpensesByKeywords(subscriptionKeywords)
    if (subscriptions.length > 0) {
      const total = sumExpenses(subscriptions)
      const monthlyAvg = total / Math.max(1, new Set(subscriptions.map(s => s.month)).size)
      const yearlyProjection = monthlyAvg * 12
      insights.push({
        icon: '🔄',
        title: 'Subscription Tracker',
        description: `₹${formatShortCurrency(total)} on subscriptions (ChatGPT, AWS, OTT). That's ~${formatShortCurrency(yearlyProjection)}/year!`
      })
    }

    // 2. Vehicle Expenses (Petrol + Maintenance)
    const vehicleKeywords = ['petrol', 'fuel', 'car', 'activa', 'bike', 'service', 'vehicle']
    const vehicleExpenses = findExpensesByKeywords(vehicleKeywords)
    if (vehicleExpenses.length > 0) {
      const total = sumExpenses(vehicleExpenses)
      const petrolExpenses = vehicleExpenses.filter(e => 
        e.breakdown?.toLowerCase().includes('petrol') || e.breakdown?.toLowerCase().includes('fuel')
      )
      const petrolTotal = sumExpenses(petrolExpenses)
      insights.push({
        icon: '🚗',
        title: 'Vehicle Expenses',
        description: `Total: ${formatShortCurrency(total)} | Fuel: ${formatShortCurrency(petrolTotal)} | ${vehicleExpenses.length} transactions`
      })
    }

    // 3. Food Breakdown (Outside vs Home/Office)
    const outsideFoodKeywords = ['swiggy', 'zomato', 'outside food', 'restaurant', 'outing', 'dining out']
    const officeFoodKeywords = ['office food', 'canteen', 'groceries', 'amazon']
    const outsideFood = findExpensesByKeywords(outsideFoodKeywords)
    const officeFood = findExpensesByKeywords(officeFoodKeywords)
    const outsideTotal = sumExpenses(outsideFood)
    const officeTotal = sumExpenses(officeFood)
    if (outsideTotal > 0 || officeTotal > 0) {
      const totalFood = outsideTotal + officeTotal
      const outsidePercent = totalFood > 0 ? Math.round((outsideTotal / totalFood) * 100) : 0
      insights.push({
        icon: '🍕',
        title: 'Food Habits',
        description: `Outside food: ${formatShortCurrency(outsideTotal)} (${outsidePercent}%) | Groceries/Office: ${formatShortCurrency(officeTotal)} (${100 - outsidePercent}%)`
      })
    }

    // 4. Gift Giving
    const giftKeywords = ['gift', 'bday', 'birthday', 'present']
    const giftExpenses = findExpensesByKeywords(giftKeywords)
    if (giftExpenses.length > 0) {
      const total = sumExpenses(giftExpenses)
      // Find top gift recipients from breakdown
      const recipients = giftExpenses
        .map(e => e.breakdown)
        .filter(Boolean)
        .slice(0, 3)
        .join(', ')
      insights.push({
        icon: '🎁',
        title: 'Gift Giver',
        description: `You've gifted ${formatShortCurrency(total)} (${giftExpenses.length} gifts). Recent: ${recipients.slice(0, 40)}...`
      })
    }

    // 5. Family Support
    const familyKeywords = ['family', 'mom', 'dad', 'parents', 'given to family']
    const familyExpenses = findExpensesByKeywords(familyKeywords)
    if (familyExpenses.length > 0) {
      const total = sumExpenses(familyExpenses)
      insights.push({
        icon: '👨‍👩‍👧',
        title: 'Family First',
        description: `${formatShortCurrency(total)} sent to family. You're a great support!`
      })
    }

    // 6. Entertainment (Concerts, Movies, Trips, Outings)
    const entertainmentKeywords = ['concert', 'movie', 'trip', 'outing', 'vacation', 'travel', 'road trip']
    const entertainment = findExpensesByKeywords(entertainmentKeywords)
    if (entertainment.length > 0) {
      const total = sumExpenses(entertainment)
      const topEvents = entertainment
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 2)
        .map(e => e.breakdown?.split(' ')[0])
        .join(', ')
      insights.push({
        icon: '🎭',
        title: 'Entertainment',
        description: `${formatShortCurrency(total)} on fun & entertainment! Top: ${topEvents}`
      })
    }

    // 7. Housing Breakdown (Rent vs Utilities)
    const rentKeywords = ['rent', 'house']
    const utilitiesKeywords = ['electricity', 'bijli', 'water', 'gas', 'wifi', 'internet', 'recharge', 'mobile']
    const rentExpenses = findExpensesByKeywords(rentKeywords)
    const utilitiesExpenses = findExpensesByKeywords(utilitiesKeywords)
    const rentTotal = sumExpenses(rentExpenses)
    const utilitiesTotal = sumExpenses(utilitiesExpenses)
    if (rentTotal > 0 || utilitiesTotal > 0) {
      insights.push({
        icon: '🏠',
        title: 'Housing Costs',
        description: `Rent: ${formatShortCurrency(rentTotal)} | Utilities & Internet: ${formatShortCurrency(utilitiesTotal)}`
      })
    }

    // 8. Health & Wellness
    const healthKeywords = ['gym', 'medicine', 'doctor', 'health', 'skincare', 'skin care', 'medical', 'hospital']
    const healthExpenses = findExpensesByKeywords(healthKeywords)
    if (healthExpenses.length > 0) {
      const total = sumExpenses(healthExpenses)
      const gymExpenses = healthExpenses.filter(e => e.breakdown?.toLowerCase().includes('gym'))
      const gymTotal = sumExpenses(gymExpenses)
      insights.push({
        icon: '💪',
        title: 'Health & Wellness',
        description: `${formatShortCurrency(total)} on health. Gym: ${formatShortCurrency(gymTotal)} | Medical: ${formatShortCurrency(total - gymTotal)}`
      })
    }

    // 9. Online Shopping (Amazon, Myntra, etc.)
    const shoppingKeywords = ['amazon', 'myntra', 'flipkart', 'zepto', 'shopping', 'e-commerce']
    const shoppingExpenses = findExpensesByKeywords(shoppingKeywords)
    if (shoppingExpenses.length > 0) {
      const total = sumExpenses(shoppingExpenses)
      const avgOrder = total / shoppingExpenses.length
      insights.push({
        icon: '🛒',
        title: 'Online Shopping',
        description: `${formatShortCurrency(total)} on ${shoppingExpenses.length} orders. Avg order: ${formatShortCurrency(avgOrder)}`
      })
    }

    // 10. Savings Rate insight
    if (summary.savingsRate) {
      const emoji = summary.savingsRate > 50 ? '🚀' : summary.savingsRate > 30 ? '💪' : '📈'
      const comment = summary.savingsRate > 50 ? 'Outstanding!' : summary.savingsRate > 30 ? 'Great job!' : 'Keep improving!'
      insights.push({
        icon: emoji,
        title: 'Savings Champion',
        description: `You're saving ${summary.savingsRate}% of your income. ${comment}`
      })
    }

    // 11. Tax efficiency insight
    if (summary.taxDeductions && summary.taxDeductions.total > 0) {
      const fyLabel = summary.taxDeductions.fiscalYear || 'this year'
      insights.push({
        icon: '💰',
        title: 'Tax Saver',
        description: `${formatShortCurrency(summary.taxDeductions.total)} optimized in advance tax (${fyLabel})`
      })
    }

    // 12. Monthly expense trend
    if (summary.monthlyTrends && summary.monthlyTrends.length > 1) {
      const lastMonth = summary.monthlyTrends[summary.monthlyTrends.length - 1]
      const prevMonth = summary.monthlyTrends[summary.monthlyTrends.length - 2]
      const change = lastMonth.expenses - prevMonth.expenses
      const emoji = change < 0 ? '📉' : change > 0 ? '📈' : '➡️'
      const direction = change < 0 ? 'decreased' : change > 0 ? 'increased' : 'stayed same'
      insights.push({
        icon: emoji,
        title: 'Spending Trend',
        description: `Expenses ${direction} by ${formatShortCurrency(Math.abs(change))} from ${prevMonth.month} to ${lastMonth.month}`
      })
    }

    // Filter out insights with zero amounts and return top 6
    return insights.filter(i => !i.description.includes('₹0')).slice(0, 6)
  }

  const insights = generateInsights()

  // Get filtered months based on selected year
  const getFilteredMonths = () => {
    if (!budgetData) return []
    
    // Filter months that belong to selected year
    return budgetData.availableMonths.filter(month => {
      const parts = month.split('/')
      if (parts.length >= 2) {
        const yearPart = 2000 + parseInt(parts[1])
        return yearPart === parseInt(selectedYear)
      }
      return false
    })
  }

  const filteredMonths = getFilteredMonths()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!budgetData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No budget data available</p>
      </div>
    )
  }

  const { summary } = budgetData

  // Prepare chart data
  const pieChartData = summary.topCategories?.map((cat, index) => ({
    ...cat,
    color: COLORS[index % COLORS.length]
  })) || []

  const monthlyTrendsData = summary.monthlyTrends?.map(trend => ({
    ...trend,
    month: trend.month // Keep full month format for cross-year clarity
  })) || []

  // Get the fiscal year label for tax section
  const taxFiscalYear = summary.taxDeductions?.fiscalYear || 'FY 2025-26'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <span className="hidden sm:inline">Monthly Budget</span>
              <span className="sm:hidden">Budget</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 ml-10 md:ml-12">
              Analyze your spending patterns
            </p>
          </div>
        </div>
        
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
          </div>
          
          {/* Year Selector */}
          {budgetData.availableYears && budgetData.availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value)
                setSelectedMonth('all')
              }}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[80px]"
            >
              {budgetData.availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          )}
          
          {/* Month Selector */}
          {filteredMonths.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[100px]"
            >
              <option value="all">All Months</option>
              {filteredMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards - 2x2 grid on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800/50 overflow-hidden">
          <CardContent className="p-3 md:p-4 relative">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
                Income
              </p>
              <p className="text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatShortCurrency(summary.totalIncome)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-100 dark:border-red-800/50 overflow-hidden">
          <CardContent className="p-3 md:p-4 relative">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-0.5">
                Expenses
              </p>
              <p className="text-lg md:text-xl font-bold text-red-700 dark:text-red-300">
                {formatShortCurrency(summary.totalExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/50 overflow-hidden">
          <CardContent className="p-3 md:p-4 relative">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <PiggyBank className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                Savings
              </p>
              <p className="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-300">
                {formatShortCurrency(summary.totalSavings)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-100 dark:border-purple-800/50 overflow-hidden">
          <CardContent className="p-3 md:p-4 relative">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                {summary.savingsRate >= 20 ? (
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5">
                Save Rate
              </p>
              <p className="text-lg md:text-xl font-bold text-purple-700 dark:text-purple-300">
                {summary.savingsRate}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights Section */}
      {insights.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-indigo-100 dark:border-indigo-800/50">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <span className="text-xl">✨</span>
                Smart Insights
              </span>
              <span className="text-xs font-normal text-indigo-500 dark:text-indigo-400 ml-7 sm:ml-0">
                AI-powered spending analysis
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-indigo-100/50 dark:border-indigo-700/30 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl md:text-2xl flex-shrink-0">{insight.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-3">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Spending Categories Pie Chart */}
        {pieChartData.length > 0 && (
          <Card className="bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-t-2xl"
              onClick={() => toggleSection('categories')}
            >
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white text-base md:text-lg">
                <span className="flex items-center gap-2">
                  <span>🎯</span>
                  <span className="hidden sm:inline">Top Spending Categories</span>
                  <span className="sm:hidden">Categories</span>
                </span>
                {collapsedSections['categories'] ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                )}
              </CardTitle>
            </CardHeader>
            {!collapsedSections['categories'] && (
              <CardContent className="pt-0">
                <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category.slice(0, 8)}${category.length > 8 ? '..' : ''} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Monthly Trends Line Chart */}
        {monthlyTrendsData.length > 0 && (
          <Card className="bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-t-2xl"
              onClick={() => toggleSection('trends')}
            >
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white text-base md:text-lg">
                <span className="flex items-center gap-2">
                  <span>📈</span>
                  <span className="hidden sm:inline">Monthly Trends</span>
                  <span className="sm:hidden">Trends</span>
                </span>
                {collapsedSections['trends'] ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                )}
              </CardTitle>
            </CardHeader>
            {!collapsedSections['trends'] && (
              <CardContent className="pt-0">
                <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendsData} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickFormatter={formatShortCurrency}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        width={45}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value as number), name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
                      <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Savings" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Advance Tax Insights - Dynamic Fiscal Year */}
      {summary.taxDeductions && summary.taxDeductions.monthlyBreakdown.length > 0 && (
        <Card className="bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-t-2xl"
            onClick={() => toggleSection('advanceTax')}
          >
            <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white text-base md:text-lg">
              <span className="flex items-center gap-2">
                <span>💰</span>
                <span className="hidden sm:inline">Advance Tax ({taxFiscalYear})</span>
                <span className="sm:hidden">Tax</span>
              </span>
              {collapsedSections['advanceTax'] ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
          {!collapsedSections['advanceTax'] && (
            <CardContent className="pt-0">
              <div className="mb-4 p-3 md:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm md:text-base font-semibold text-amber-800 dark:text-amber-200">Total Advance Tax</h4>
                  <span className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(summary.taxDeductions.total)}</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {taxFiscalYear} • {summary.taxDeductions.monthlyBreakdown.length} installment{summary.taxDeductions.monthlyBreakdown.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.taxDeductions.monthlyBreakdown} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatShortCurrency}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Advance Tax']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
