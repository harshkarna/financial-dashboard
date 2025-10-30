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
    }
  }
  availableMonths: string[]
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
]

export function MonthlyBudget() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchBudgetData()
  }, [selectedMonth])

  const fetchBudgetData = async () => {
    setLoading(true)
    try {
      const params = selectedMonth !== 'all' ? `?month=${selectedMonth}` : ''
      const response = await fetch(`/api/budget${params}`)
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

  // Generate creative insights
  const generateInsights = () => {
    if (!budgetData) return []

    const insights = []
    const { summary } = budgetData

    // Top spending category insight
    if (summary.topCategories && summary.topCategories.length > 0) {
      const topCategory = summary.topCategories[0]
      const percentage = ((topCategory.amount / summary.totalExpenses) * 100).toFixed(1)
      insights.push({
        icon: '🏆',
        title: 'Biggest Spender',
        description: `${topCategory.category} takes the crown with ${formatShortCurrency(topCategory.amount)} (${percentage}% of total expenses)`
      })
    }

    // Savings rate insight
    if (summary.savingsRate) {
      const emoji = summary.savingsRate > 50 ? '🚀' : summary.savingsRate > 30 ? '💪' : '📈'
      const comment = summary.savingsRate > 50 ? 'Outstanding!' : summary.savingsRate > 30 ? 'Great job!' : 'Keep improving!'
      insights.push({
        icon: emoji,
        title: 'Savings Champion',
        description: `You're saving ${summary.savingsRate.toFixed(1)}% of your income. ${comment}`
      })
    }

    // Monthly expense trend
    if (summary.monthlyTrends && summary.monthlyTrends.length > 1) {
      const lastMonth = summary.monthlyTrends[summary.monthlyTrends.length - 1]
      const prevMonth = summary.monthlyTrends[summary.monthlyTrends.length - 2]
      const change = lastMonth.expenses - prevMonth.expenses
      const emoji = change < 0 ? '📉' : change > 0 ? '📈' : '➡️'
      const direction = change < 0 ? 'decreased' : change > 0 ? 'increased' : 'stayed same'
      insights.push({
        icon: emoji,
        title: 'Spending Trend',
        description: `Your expenses ${direction} by ${formatShortCurrency(Math.abs(change))} last month`
      })
    }

    // Tax efficiency insight
    if (summary.taxDeductions && summary.taxDeductions.total > 0) {
      insights.push({
        icon: '💰',
        title: 'Tax Saver',
        description: `You've optimized ${formatShortCurrency(summary.taxDeductions.total)} in tax deductions this year`
      })
    }

    // Category diversity insight
    if (summary.topCategories) {
      const categoryCount = summary.topCategories.length
      const emoji = categoryCount > 8 ? '🌈' : categoryCount > 5 ? '🎯' : '🔍'
      insights.push({
        icon: emoji,
        title: 'Spending Diversity',
        description: `Your money flows across ${categoryCount} different categories. ${categoryCount > 8 ? 'Very diverse!' : 'Good balance!'}`
      })
    }

    // Fun category-specific insights
    if (summary.topCategories) {
      const categories = summary.topCategories.map(c => c.category.toLowerCase())
      
      // Food insights
      const foodCategories = categories.filter(cat => 
        cat.includes('food') || cat.includes('dining') || cat.includes('restaurant')
      )
      if (foodCategories.length > 0) {
        const foodSpending = summary.topCategories
          .filter(c => foodCategories.includes(c.category.toLowerCase()))
          .reduce((sum, c) => sum + c.amount, 0)
        insights.push({
          icon: '🍕',
          title: 'Foodie Alert',
          description: `You've spent ${formatShortCurrency(foodSpending)} on food & dining. That's approximately ${Math.floor(foodSpending / 500)} restaurant meals!`
        })
      }

      // Travel insights
      const travelSpending = summary.topCategories.find(c => 
        c.category.toLowerCase().includes('travel') || c.category.toLowerCase().includes('transport')
      )
      if (travelSpending && travelSpending.amount > 5000) {
        insights.push({
          icon: '✈️',
          title: 'Travel Enthusiast',
          description: `${formatShortCurrency(travelSpending.amount)} on travel & transport. Adventure awaits!`
        })
      }

      // Shopping insights
      const shoppingSpending = summary.topCategories.find(c => 
        c.category.toLowerCase().includes('shopping') || c.category.toLowerCase().includes('e-commerce')
      )
      if (shoppingSpending && shoppingSpending.amount > 10000) {
        insights.push({
          icon: '🛍️',
          title: 'Shopping Spree',
          description: `${formatShortCurrency(shoppingSpending.amount)} on shopping. Retail therapy in action!`
        })
      }
    }

    // Income growth insight
    if (summary.monthlyTrends && summary.monthlyTrends.length > 2) {
      const recentMonths = summary.monthlyTrends.slice(-3)
      const avgIncome = recentMonths.reduce((sum, m) => sum + m.income, 0) / recentMonths.length
      const firstIncome = recentMonths[0].income
      const lastIncome = recentMonths[recentMonths.length - 1].income
      
      if (lastIncome > firstIncome * 1.1) {
        insights.push({
          icon: '📈',
          title: 'Income Growth',
          description: `Your income is trending upward! ${formatShortCurrency(lastIncome - firstIncome)} increase in recent months`
        })
      }
    }

    return insights.slice(0, 6) // Return top 6 insights
  }

  const insights = generateInsights()

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
    month: trend.month.replace(/\d{4}/, '').trim() // Remove year for cleaner display
  })) || []

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-600" />
          Monthly Budget Analysis
        </h2>
        
        {budgetData.availableMonths.length > 0 && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="all">All Months</option>
              {budgetData.availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Current Income</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatShortCurrency(summary.totalIncome)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">Current Expenses</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatShortCurrency(summary.totalExpenses)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Current Savings</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatShortCurrency(summary.totalSavings)}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Savings Rate</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {summary.savingsRate}%
                </p>
              </div>
              {summary.savingsRate >= 20 ? (
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights Section */}
      {insights.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              ✨ Smart Insights
              <span className="text-sm font-normal text-indigo-600 dark:text-indigo-400">
                AI-powered analysis of your spending patterns
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories Pie Chart */}
        {pieChartData.length > 0 && (
          <Card className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('categories')}
            >
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                🎯 Top Spending Categories
                {collapsedSections['categories'] ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {!collapsedSections['categories'] && (
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
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
          <Card className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('trends')}
            >
              <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                📈 Monthly Trends (Last 4 Months)
                {collapsedSections['trends'] ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {!collapsedSections['trends'] && (
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                      <XAxis 
                        dataKey="month" 
                        className="text-gray-600 dark:text-gray-400"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-gray-600 dark:text-gray-400"
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatShortCurrency}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value as number), name]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                      <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Savings" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Advance Tax Insights */}
      {summary.taxDeductions && summary.taxDeductions.monthlyBreakdown.length > 0 && (
        <Card className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('advanceTax')}
          >
            <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
              💰 Advance Tax Insights (Apr 2025 onwards)
              {collapsedSections['advanceTax'] ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          {!collapsedSections['advanceTax'] && (
            <CardContent>
              <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-200">💰 Total Advance Tax Due</h4>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary.taxDeductions.total)}</span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Since April 2025 • {summary.taxDeductions.monthlyBreakdown.length} installment{summary.taxDeductions.monthlyBreakdown.length > 1 ? 's' : ''} due
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.taxDeductions.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                    <XAxis 
                      dataKey="month" 
                      className="text-gray-600 dark:text-gray-400"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-gray-600 dark:text-gray-400"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatShortCurrency}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Advance Tax']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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