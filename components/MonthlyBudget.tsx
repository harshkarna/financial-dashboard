'use client'

import { useState, useEffect } from 'react'

// Premium Card components with dark glassmorphism
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-lg ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`px-5 py-4 border-b border-slate-700/50 ${className}`} onClick={onClick}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-bold text-white ${className}`}>
    {children}
  </h3>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-5 py-4 ${className}`}>
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

// Vibrant colors for charts
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
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
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700/50 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-700/50 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-700/50 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!budgetData) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-slate-400 text-lg">No budget data available</p>
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30">
              <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            Monthly Budget
          </h1>
          <p className="text-sm text-slate-400 mt-1 ml-[52px] md:ml-[60px]">
            Analyze your spending patterns
          </p>
        </div>
        
        {/* Filter Pills */}
        <div className="flex items-center gap-3">
          {/* Year Selector */}
          {budgetData.availableYears && budgetData.availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value)
                setSelectedMonth('all')
              }}
              className="appearance-none bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl border border-slate-600 focus:outline-none focus:border-purple-500 font-medium min-w-[90px]"
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
              className="appearance-none bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl border border-slate-600 focus:outline-none focus:border-purple-500 font-medium min-w-[120px]"
            >
              <option value="all">All Months</option>
              {filteredMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards - Premium Dark Style with Glow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-900/50 to-green-900/40 rounded-2xl p-5 border border-emerald-500/30 glow-green hover-lift card-shine">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors"></div>
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <p className="text-emerald-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Income</p>
            <p className="text-2xl md:text-3xl font-black text-white">{formatShortCurrency(summary.totalIncome)}</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-red-900/50 to-rose-900/40 rounded-2xl p-5 border border-red-500/30 glow-red hover-lift card-shine">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-colors"></div>
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-red-500/30">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <p className="text-red-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Expenses</p>
            <p className="text-2xl md:text-3xl font-black text-white">{formatShortCurrency(summary.totalExpenses)}</p>
          </div>
        </div>

        {/* Savings Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-cyan-900/40 rounded-2xl p-5 border border-blue-500/30 glow-blue hover-lift card-shine">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors"></div>
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            <p className="text-blue-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Savings</p>
            <p className="text-2xl md:text-3xl font-black text-white">{formatShortCurrency(summary.totalSavings)}</p>
          </div>
        </div>

        {/* Save Rate Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/40 rounded-2xl p-5 border border-purple-500/30 glow-purple hover-lift card-shine">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors"></div>
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
              {summary.savingsRate >= 20 ? (
                <TrendingUp className="h-5 w-5 text-white" />
              ) : (
                <TrendingDown className="h-5 w-5 text-white" />
              )}
            </div>
            <p className="text-purple-400/90 text-xs uppercase tracking-wider font-semibold mb-1">Save Rate</p>
            <p className="text-2xl md:text-3xl font-black text-white">{summary.savingsRate}%</p>
          </div>
        </div>
      </div>

      {/* Smart Insights Section */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/80 via-purple-900/20 to-slate-800/80 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-purple-500/20 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Smart Insights</h3>
              <p className="text-xs text-purple-400">AI-powered spending analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="group bg-slate-700/50 hover:bg-slate-700/80 rounded-xl p-4 border border-slate-600/50 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{insight.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-white text-sm mb-1">{insight.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories Pie Chart */}
        {pieChartData.length > 0 && (
          <div className="glass-dark rounded-2xl glow-cyan overflow-hidden">
            <div 
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-700/30 transition-colors border-b border-slate-700/50"
              onClick={() => toggleSection('categories')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <span className="text-lg">🎯</span>
                </div>
                <h3 className="text-lg font-bold text-white">Top Spending Categories</h3>
              </div>
              {collapsedSections['categories'] ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              )}
            </div>
            {!collapsedSections['categories'] && (
              <div className="px-5 pb-5 pt-3">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category.slice(0, 8)}${category.length > 8 ? '..' : ''} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={85}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="amount"
                        stroke="rgba(30, 41, 59, 0.8)"
                        strokeWidth={2}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)} 
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '12px',
                          color: '#fff',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                        }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                        itemStyle={{ color: '#22d3ee' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monthly Trends Line Chart */}
        {monthlyTrendsData.length > 0 && (
          <div className="glass-dark rounded-2xl glow-green overflow-hidden">
            <div 
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-700/30 transition-colors border-b border-slate-700/50"
              onClick={() => toggleSection('trends')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <span className="text-lg">📈</span>
                </div>
                <h3 className="text-lg font-bold text-white">Monthly Trends</h3>
              </div>
              {collapsedSections['trends'] ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              )}
            </div>
            {!collapsedSections['trends'] && (
              <div className="px-5 pb-5 pt-3">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendsData} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={formatShortCurrency}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                        width={50}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value as number), name]}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '12px',
                          color: '#fff',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                        }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }} activeDot={{ r: 7 }} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: '#ef4444', stroke: '#7f1d1d', strokeWidth: 2 }} activeDot={{ r: 7 }} name="Expenses" />
                      <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6', stroke: '#1e3a8a', strokeWidth: 2 }} activeDot={{ r: 7 }} name="Savings" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advance Tax Insights - Dynamic Fiscal Year */}
      {summary.taxDeductions && summary.taxDeductions.monthlyBreakdown.length > 0 && (
        <div className="glass-dark rounded-2xl glow-amber overflow-hidden">
          <div 
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-700/30 transition-colors border-b border-slate-700/50"
            onClick={() => toggleSection('advanceTax')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-lg">💰</span>
              </div>
              <h3 className="text-lg font-bold text-white">Advance Tax ({taxFiscalYear})</h3>
            </div>
            {collapsedSections['advanceTax'] ? (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            )}
          </div>
          {!collapsedSections['advanceTax'] && (
            <div className="px-5 pb-5 pt-3 space-y-4">
              {/* Tax Summary Card */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-amber-900/50 to-orange-900/40 rounded-xl p-5 border border-amber-500/30 hover-lift">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-colors"></div>
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">Total Advance Tax</h4>
                    <p className="text-xs text-amber-400/70 mt-1">
                      {taxFiscalYear} • {summary.taxDeductions.monthlyBreakdown.length} installment{summary.taxDeductions.monthlyBreakdown.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-3xl md:text-4xl font-black text-white">{formatCurrency(summary.taxDeductions.total)}</span>
                </div>
              </div>
              
              {/* Tax Bar Chart */}
              <div className="h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.taxDeductions.monthlyBreakdown} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={formatShortCurrency}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                      width={50}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Advance Tax']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                      }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                      itemStyle={{ color: '#fbbf24' }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {summary.taxDeductions.monthlyBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${38 + index * 3}, 95%, ${60 - index * 2}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
