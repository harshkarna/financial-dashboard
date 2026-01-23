'use client'

import { useEffect, useState } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Award,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  Timer,
  CalendarDays
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'

interface IncomeEntry {
  description: string
  status: string
  fy: string
  invoiceDate: string
  totalUSD: number
  estimate: number
  actual: number
  rateConversion: number
  category: 'course' | 'royalty' | 'miscellaneous'
}

interface CategoryData {
  count: number
  totalINR: number
  entries: IncomeEntry[]
}

interface TaxByFY {
  fy: string
  totalReceivedUSD: number
  totalReceivedINR: number
  otherTaxes: number
  totalTaxDue: number
  paymentDone: number
  paymentDue: number
}

interface FYSummary {
  fy: string
  totalUSD: number
  totalINR: number
  courseCount: number
  avgCourseEarning: number
  paidCount: number
  pendingCount: number
  pendingAmount: number
}

interface CourseInsights {
  shortestGap: {
    days: number
    fromCourse: string
    toCourse: string
    fromDate: string
    toDate: string
  } | null
  longestGap: {
    days: number
    fromCourse: string
    toCourse: string
    fromDate: string
    toDate: string
  } | null
  avgGapDays: number
  totalCourses: number
  firstCourse: { name: string; date: string } | null
  lastCourse: { name: string; date: string } | null
  coursesThisYear: number
  coursesLastYear: number
}

interface OtherIncomeData {
  summary: {
    totalEarningsUSD: number
    totalEarningsINR: number
    totalCourses: number
    paidCourses: number
    pendingPayments: number
    pendingCount: number
    avgCourseEarning: number
    avgConversionRate: number
  }
  categories: {
    courses: CategoryData
    royalties: CategoryData
    miscellaneous: CategoryData
  }
  taxes: {
    totalTaxesPaid: number
    totalTaxesDue: number
    totalTaxLiability: number
    effectiveTaxRate: number
    byFY: TaxByFY[]
  }
  fyBreakdown: FYSummary[]
  fyComparison: {
    currentFY: string
    currentFYData: FYSummary | null
    previousFYData: FYSummary | null
    yoyGrowth: number
  }
  topCourses: IncomeEntry[]
  courseInsights: CourseInsights
  entries: IncomeEntry[]
  monthlyTrend: { month: string; amount: number; usd: number }[]
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export function OtherIncomeAnalytics() {
  const [data, setData] = useState<OtherIncomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllEntries, setShowAllEntries] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    entries: false,
    taxes: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/other-income')
      if (!response.ok) throw new Error('Failed to fetch data')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('Failed to load other income data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number, currency: 'INR' | 'USD' = 'INR') => {
    if (currency === 'USD') {
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    }
    const absValue = Math.abs(value)
    if (absValue >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`
    }
    if (absValue >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`
    }
    if (absValue >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`
    }
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-dark rounded-2xl p-6 glow-purple">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-700/50 rounded-lg w-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-700/50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass-dark rounded-2xl p-8 text-center glow-red">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 font-medium">{error || 'No data available'}</p>
      </div>
    )
  }

  const { summary, categories, taxes, fyBreakdown, fyComparison, topCourses, courseInsights, entries, monthlyTrend } = data
  
  // Calculate advance tax deadline info
  const getAdvanceTaxDeadlineInfo = () => {
    const now = new Date()
    const currentMonth = now.getMonth() // 0-indexed (Jan = 0, Mar = 2, Apr = 3)
    const currentYear = now.getFullYear()
    
    // Determine current FY
    // FY runs April to March
    // If we're in Jan-Mar, we're in the end of FY that started previous year
    // If we're in Apr-Dec, we're in the FY that started this year
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1
    
    // Advance tax deadlines with CUMULATIVE percentages for current FY:
    // - 15th June (of FY start year): At least 15%
    // - 15th Sep (of FY start year): At least 45%
    // - 15th Dec (of FY start year): At least 75%
    // - 15th March (of FY start year + 1): 100% (final deadline)
    const deadlines = [
      { year: fyStartYear, month: 5, day: 15, label: '15th June', quarter: 'Q1', cumulativePercent: 15, description: 'At least 15% of annual tax' },
      { year: fyStartYear, month: 8, day: 15, label: '15th September', quarter: 'Q2', cumulativePercent: 45, description: 'At least 45% of annual tax' },
      { year: fyStartYear, month: 11, day: 15, label: '15th December', quarter: 'Q3', cumulativePercent: 75, description: 'At least 75% of annual tax' },
      { year: fyStartYear + 1, month: 2, day: 15, label: '15th March', quarter: 'Q4', cumulativePercent: 100, description: '100% of annual tax (Final)' }
    ]
    
    // Find next upcoming deadline
    for (const deadline of deadlines) {
      const deadlineDate = new Date(deadline.year, deadline.month, deadline.day)
      
      if (now < deadlineDate) {
        const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          nextDeadline: deadline.label,
          quarter: deadline.quarter,
          daysUntil,
          cumulativePercent: deadline.cumulativePercent,
          description: deadline.description,
          isUrgent: daysUntil <= 30
        }
      }
    }
    
    // All deadlines passed for current FY, show next FY's first deadline
    const nextFYStartYear = fyStartYear + 1
    const nextJuneDate = new Date(nextFYStartYear, 5, 15)
    const daysUntil = Math.ceil((nextJuneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return { 
      nextDeadline: '15th June', 
      quarter: 'Q1 (Next FY)',
      daysUntil, 
      cumulativePercent: 15, 
      description: 'At least 15% of annual tax',
      isUrgent: false 
    }
  }
  
  const advanceTaxInfo = getAdvanceTaxDeadlineInfo()
  
  // Get current FY tax data only (not combined)
  const getCurrentFYTax = () => {
    const now = new Date()
    const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const currentFYKey = `${currentFYStart}-${(currentFYStart + 1).toString().slice(-2)}`
    return taxes.byFY.find(t => t.fy === currentFYKey)
  }
  
  const currentFYTaxData = getCurrentFYTax()

  // Prepare FY comparison chart data
  const fyChartData = fyBreakdown.map(fy => ({
    name: `FY ${fy.fy}`,
    earnings: fy.totalINR,
    courses: fy.courseCount,
    avgEarning: fy.avgCourseEarning
  })).reverse()

  // Tax breakdown pie data
  const taxPieData = taxes.byFY.map((t, i) => ({
    name: `FY ${t.fy}`,
    value: t.totalTaxDue,
    color: CHART_COLORS[i % CHART_COLORS.length]
  })).filter(t => t.value > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-dark rounded-2xl p-5 glow-purple">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Course Income Analytics</h1>
            <p className="text-slate-400 text-sm">Pluralsight & Other Income Sources</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Live Data</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="glass-dark rounded-2xl p-5 glow-green relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Earnings</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{formatCurrency(summary.totalEarningsINR)}</p>
          <p className="text-sm text-emerald-400">{formatCurrency(summary.totalEarningsUSD, 'USD')}</p>
          <Sparkles className="absolute -right-2 -bottom-2 w-20 h-20 text-emerald-500/10" />
        </div>

        {/* Published Courses */}
        <div className="glass-dark rounded-2xl p-5 glow-blue relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Published Courses</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{categories.courses.count}</p>
          <p className="text-sm text-blue-400">{formatCurrency(categories.courses.totalINR)} earned</p>
          <Target className="absolute -right-2 -bottom-2 w-20 h-20 text-blue-500/10" />
        </div>

        {/* Avg Per Course (only from published courses) */}
        <div className="glass-dark rounded-2xl p-5 glow-purple relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Avg/Course</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{formatCurrency(summary.avgCourseEarning)}</p>
          <p className="text-sm text-purple-400">Per published course</p>
          <Award className="absolute -right-2 -bottom-2 w-20 h-20 text-purple-500/10" />
        </div>

        {/* Pending Payments */}
        <div className="glass-dark rounded-2xl p-5 glow-amber relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Pending</span>
          </div>
          <p className="text-3xl font-black text-amber-400 mb-1">{formatCurrency(summary.pendingPayments)}</p>
          <p className="text-sm text-slate-400">{summary.pendingCount} invoices awaiting</p>
          <Receipt className="absolute -right-2 -bottom-2 w-20 h-20 text-amber-500/10" />
        </div>
      </div>

      {/* Income Breakdown by Category */}
      <div className="glass-dark rounded-2xl p-5 glow-cyan">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <PieChartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Income Breakdown</h3>
            <p className="text-xs text-slate-400">By category</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Courses */}
          <div className="p-4 bg-gradient-to-br from-blue-900/40 to-cyan-900/30 rounded-xl border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Published Courses</span>
            </div>
            <p className="text-2xl font-black text-white">{formatCurrency(categories.courses.totalINR)}</p>
            <p className="text-xs text-slate-400 mt-1">{categories.courses.count} courses</p>
          </div>
          
          {/* Royalties */}
          <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/30 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Quarterly Royalties</span>
            </div>
            <p className="text-2xl font-black text-white">{formatCurrency(categories.royalties.totalINR)}</p>
            <p className="text-xs text-slate-400 mt-1">{categories.royalties.count} quarters</p>
          </div>
          
          {/* Miscellaneous */}
          <div className="p-4 bg-gradient-to-br from-amber-900/40 to-orange-900/30 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Miscellaneous</span>
            </div>
            <p className="text-2xl font-black text-white">{formatCurrency(categories.miscellaneous.totalINR)}</p>
            <p className="text-xs text-slate-400 mt-1">{categories.miscellaneous.count} entries (referrals, etc.)</p>
          </div>
        </div>
      </div>

      {/* Course Publishing Insights */}
      {courseInsights && (courseInsights.shortestGap || courseInsights.longestGap) && (
        <div className="glass-dark rounded-2xl p-5 glow-green">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Publishing Insights</h3>
              <p className="text-xs text-slate-400">Course frequency analysis</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fastest Turnaround */}
            {courseInsights.shortestGap && (
              <div className="p-4 bg-gradient-to-br from-emerald-900/40 to-green-900/30 rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Fastest Turnaround</span>
                </div>
                <p className="text-2xl font-black text-white">{courseInsights.shortestGap.days} days</p>
                <p className="text-xs text-slate-400 mt-1 truncate" title={courseInsights.shortestGap.toCourse}>
                  {courseInsights.shortestGap.fromDate} → {courseInsights.shortestGap.toDate}
                </p>
              </div>
            )}
            
            {/* Longest Gap */}
            {courseInsights.longestGap && (
              <div className="p-4 bg-gradient-to-br from-amber-900/40 to-orange-900/30 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Longest Gap</span>
                </div>
                <p className="text-2xl font-black text-white">{courseInsights.longestGap.days} days</p>
                <p className="text-xs text-slate-400 mt-1 truncate" title={courseInsights.longestGap.toCourse}>
                  {courseInsights.longestGap.fromDate} → {courseInsights.longestGap.toDate}
                </p>
              </div>
            )}
            
            {/* Average Gap */}
            <div className="p-4 bg-gradient-to-br from-blue-900/40 to-cyan-900/30 rounded-xl border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Avg. Gap</span>
              </div>
              <p className="text-2xl font-black text-white">{courseInsights.avgGapDays} days</p>
              <p className="text-xs text-slate-400 mt-1">Between courses</p>
            </div>
            
            {/* This Year vs Last Year */}
            <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/30 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">This Year</span>
              </div>
              <p className="text-2xl font-black text-white">{courseInsights.coursesThisYear} courses</p>
              <p className="text-xs text-slate-400 mt-1">
                vs {courseInsights.coursesLastYear} last year
                {courseInsights.coursesLastYear > 0 && (
                  <span className={courseInsights.coursesThisYear >= courseInsights.coursesLastYear ? ' text-emerald-400' : ' text-red-400'}>
                    {' '}({courseInsights.coursesThisYear >= courseInsights.coursesLastYear ? '+' : ''}{courseInsights.coursesThisYear - courseInsights.coursesLastYear})
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* First and Last Course */}
          {courseInsights.firstCourse && courseInsights.lastCourse && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">First course:</span>
                <span className="text-white font-medium truncate max-w-xs" title={courseInsights.firstCourse.name}>
                  {courseInsights.firstCourse.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Latest course:</span>
                <span className="text-white font-medium truncate max-w-xs" title={courseInsights.lastCourse.name}>
                  {courseInsights.lastCourse.date}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* YoY Comparison & Tax Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year over Year Comparison */}
        <div className="glass-dark rounded-2xl overflow-hidden glow-blue">
          <div className="p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Year-over-Year Growth</h3>
                <p className="text-xs text-slate-400">Financial Year Comparison</p>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            {fyComparison.currentFYData && fyComparison.previousFYData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Current FY ({fyComparison.currentFY})</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(fyComparison.currentFYData.totalINR)}</p>
                    <p className="text-sm text-blue-400">{fyComparison.currentFYData.courseCount} courses</p>
                  </div>
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl
                    ${fyComparison.yoyGrowth >= 0 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                    }
                  `}>
                    {fyComparison.yoyGrowth >= 0 
                      ? <ArrowUpRight className="w-5 h-5" />
                      : <ArrowDownRight className="w-5 h-5" />
                    }
                    <span className="text-xl font-bold">{formatPercent(fyComparison.yoyGrowth)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Previous FY ({fyComparison.previousFYData.fy})</p>
                    <p className="text-xl font-bold text-slate-300">{formatCurrency(fyComparison.previousFYData.totalINR)}</p>
                    <p className="text-sm text-slate-500">{fyComparison.previousFYData.courseCount} courses</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Not enough data for YoY comparison</p>
              </div>
            )}
          </div>
        </div>

        {/* Tax Summary with Advance Tax Tracking */}
        <div className="glass-dark rounded-2xl overflow-hidden glow-red">
          <div 
            className="p-5 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors"
            onClick={() => toggleSection('taxes')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Advance Tax Tracker</h3>
                  <p className="text-xs text-slate-400">Effective Rate: {taxes.effectiveTaxRate.toFixed(1)}%</p>
                </div>
              </div>
              {expandedSections['taxes'] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>
          
          {expandedSections['taxes'] && (
            <div className="p-5 space-y-4">
              {/* Next Deadline Alert */}
              <div className={`p-4 rounded-xl border ${advanceTaxInfo.isUrgent ? 'bg-red-900/30 border-red-500/50' : 'bg-amber-900/20 border-amber-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`w-5 h-5 ${advanceTaxInfo.isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
                    <div>
                      <p className={`font-medium ${advanceTaxInfo.isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                        Next Deadline: {advanceTaxInfo.nextDeadline} ({advanceTaxInfo.quarter})
                      </p>
                      <p className="text-xs text-slate-400">
                        {advanceTaxInfo.description}
                      </p>
                    </div>
                  </div>
                  <div className={`text-right px-3 py-1 rounded-lg ${advanceTaxInfo.isUrgent ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                    <p className={`text-lg font-bold ${advanceTaxInfo.isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                      {advanceTaxInfo.daysUntil} days
                    </p>
                    <p className="text-xs text-slate-400">remaining</p>
                  </div>
                </div>
              </div>

              {/* Current FY Tax Details */}
              {currentFYTaxData && (
                <div className="space-y-4">
                  {/* Current FY Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-800/50 rounded-xl text-center border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-1">Tax Liability (FY {currentFYTaxData.fy})</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(currentFYTaxData.totalTaxDue)}</p>
                    </div>
                    <div className="p-3 bg-emerald-900/30 rounded-xl text-center border border-emerald-500/30">
                      <p className="text-xs text-emerald-400 mb-1">Paid</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(currentFYTaxData.paymentDone)}</p>
                    </div>
                    <div className="p-3 bg-red-900/30 rounded-xl text-center border border-red-500/30">
                      <p className="text-xs text-red-400 mb-1">Pending</p>
                      <p className="text-lg font-bold text-red-400">{formatCurrency(currentFYTaxData.paymentDue)}</p>
                    </div>
                  </div>

                  {/* Current FY - Detailed */}
                  <div className="p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-white font-bold text-lg">Current FY {currentFYTaxData.fy}</span>
                      </div>
                      {currentFYTaxData.paymentDue > 0 ? (
                        <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Due: {formatCurrency(currentFYTaxData.paymentDue)}
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Fully Paid
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Total Income</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(currentFYTaxData.totalReceivedINR)}</p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Tax Liability</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(currentFYTaxData.totalTaxDue)}</p>
                      </div>
                      <div className="p-3 bg-emerald-900/30 rounded-lg border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 mb-1">Paid</p>
                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(currentFYTaxData.paymentDone)}</p>
                      </div>
                      <div className={`p-3 rounded-lg border ${currentFYTaxData.paymentDue > 0 ? 'bg-red-900/30 border-red-500/20' : 'bg-slate-900/50 border-slate-700/30'}`}>
                        <p className={`text-xs mb-1 ${currentFYTaxData.paymentDue > 0 ? 'text-red-400' : 'text-slate-500'}`}>Pending</p>
                        <p className={`text-lg font-bold ${currentFYTaxData.paymentDue > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {formatCurrency(currentFYTaxData.paymentDue)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all"
                        style={{ width: `${currentFYTaxData.totalTaxDue > 0 ? Math.min((currentFYTaxData.paymentDone / currentFYTaxData.totalTaxDue) * 100, 100) : 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-400 mt-2 text-right font-medium">
                      {(() => {
                        if (currentFYTaxData.totalTaxDue <= 0) return '100'
                        const percent = (currentFYTaxData.paymentDone / currentFYTaxData.totalTaxDue) * 100
                        // Show decimal if not exactly 100% and there's pending amount
                        if (currentFYTaxData.paymentDue > 0 && percent >= 99.5) {
                          return percent.toFixed(1)
                        }
                        return percent.toFixed(0)
                      })()}% of tax paid
                    </p>
                  </div>
                  
                  {/* Previous FY - Brief */}
                  {(() => {
                    const previousFYTax = taxes.byFY.find(t => t.fy !== currentFYTaxData.fy)
                    if (!previousFYTax) return null
                    
                    return (
                      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                            <span className="text-slate-300 font-medium">Previous FY {previousFYTax.fy}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-400">
                              Income: <span className="text-white font-medium">{formatCurrency(previousFYTax.totalReceivedINR)}</span>
                            </span>
                            <span className="text-slate-400">
                              Tax: <span className="text-white font-medium">{formatCurrency(previousFYTax.totalTaxDue)}</span>
                            </span>
                            {previousFYTax.paymentDue > 0 ? (
                              <span className="text-red-400 font-medium">Due: {formatCurrency(previousFYTax.paymentDue)}</span>
                            ) : (
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Paid
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Earnings Trend Chart */}
      {monthlyTrend.length > 0 && (
        <div className="glass-dark rounded-2xl overflow-hidden glow-green">
          <div className="p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Earnings Timeline</h3>
                <p className="text-xs text-slate-400">Monthly course income breakdown</p>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                    width={50}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Earnings']}
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
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEarnings)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* FY Comparison Bar Chart */}
      {fyChartData.length > 0 && (
        <div className="glass-dark rounded-2xl overflow-hidden glow-purple">
          <div className="p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <PieChartIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Financial Year Breakdown</h3>
                <p className="text-xs text-slate-400">Earnings comparison by FY</p>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fyChartData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                    width={50}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'earnings') return [formatCurrency(value), 'Earnings']
                      return [value, name]
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Bar dataKey="earnings" radius={[8, 8, 0, 0]}>
                    {fyChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Top Earning Courses */}
      <div className="glass-dark rounded-2xl overflow-hidden glow-amber">
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Top Earning Courses</h3>
              <p className="text-xs text-slate-400">Your best performing content</p>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          <div className="space-y-3">
            {topCourses.map((course, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-colors"
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                  ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900' : 
                    i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900' :
                    i === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                    'bg-slate-700 text-slate-300'
                  }
                `}>
                  {i + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{course.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>FY {course.fy}</span>
                    <span>•</span>
                    <span>{course.invoiceDate}</span>
                    <span>•</span>
                    <span className={course.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}>
                      {course.status}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatCurrency(course.actual || course.estimate)}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(course.totalUSD, 'USD')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Entries Table */}
      <div className="glass-dark rounded-2xl overflow-hidden glow-blue">
        <div 
          className="p-5 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors"
          onClick={() => toggleSection('entries')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">All Income Entries</h3>
                <p className="text-xs text-slate-400">{entries.length} total entries</p>
              </div>
            </div>
            {expandedSections['entries'] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </div>
        
        {expandedSections['entries'] && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">FY</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">USD</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">INR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(showAllEntries ? entries : entries.slice(0, 10)).map((entry, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium truncate max-w-xs">{entry.description}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{entry.fy}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{entry.invoiceDate}</td>
                    <td className="px-5 py-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${entry.status === 'Paid' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-amber-500/20 text-amber-400'
                        }
                      `}>
                        {entry.status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-blue-400 font-medium">
                      {formatCurrency(entry.totalUSD, 'USD')}
                    </td>
                    <td className="px-5 py-4 text-right text-white font-bold">
                      {formatCurrency(entry.actual || entry.estimate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {entries.length > 10 && (
              <div className="p-4 text-center border-t border-slate-700/50">
                <button
                  onClick={() => setShowAllEntries(!showAllEntries)}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {showAllEntries ? 'Show Less' : `Show All ${entries.length} Entries`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
