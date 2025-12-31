'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface TrendChartProps {
  currentMonth: string
}

interface ChartData {
  month: string
  netWorth: number
}

export function TrendChart({ currentMonth }: TrendChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendData()
  }, [])

  const fetchTrendData = async () => {
    try {
      setLoading(true)
      
      const monthsResponse = await fetch('/api/months')
      if (!monthsResponse.ok) throw new Error('Failed to fetch months')
      
      const monthsData = await monthsResponse.json()
      const availableMonths = monthsData.months || []
      
      const recentMonths = availableMonths.slice(0, 5).reverse()
      
      const chartDataPromises = recentMonths.map(async (month: string) => {
        const response = await fetch(`/api/sheets?month=${encodeURIComponent(month)}`)
        if (response.ok) {
          const data = await response.json()
          return { month, netWorth: data.netWorth || 0 }
        }
        return { month, netWorth: 0 }
      })
      
      const results = await Promise.all(chartDataPromises)
      setChartData(results)
    } catch (error) {
      console.error('Error fetching trend data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(value)
  }

  const formatShort = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return `${value}`
  }

  const getGrowthStats = () => {
    if (chartData.length < 2) return { percentage: 'N/A', isPositive: true, amount: 0 }
    const firstValue = chartData[0].netWorth
    const lastValue = chartData[chartData.length - 1].netWorth
    if (firstValue === 0) return { percentage: 'N/A', isPositive: true, amount: 0 }
    const growth = ((lastValue - firstValue) / firstValue) * 100
    return {
      percentage: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      isPositive: growth >= 0,
      amount: lastValue - firstValue
    }
  }

  const growthStats = getGrowthStats()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 h-80">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-40" />
          <div className="h-52 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
      {/* Decorative background */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-10" />
      
      <div className="relative p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
        <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Net Worth Trend</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly progression</p>
        </div>
      </div>
      
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-lg">
              Last 5 months
            </span>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-48 md:h-56 mb-4">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
            <XAxis 
              dataKey="month" 
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickFormatter={(value) => value.split(' ')[0]}
                axisLine={false}
                tickLine={false}
            />
            <YAxis 
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickFormatter={formatShort}
                axisLine={false}
                tickLine={false}
                width={40}
            />
              <Tooltip content={<CustomTooltip />} />
              <Area
              type="monotone" 
              dataKey="netWorth" 
              stroke="#3B82F6" 
                strokeWidth={2.5}
                fill="url(#colorGradient)"
              dot={{ 
                fill: '#3B82F6', 
                  strokeWidth: 2, 
                  r: 4,
                stroke: '#ffffff'
              }}
              activeDot={{ 
                  r: 6, 
                stroke: '#3B82F6', 
                  strokeWidth: 2,
                fill: '#ffffff'
              }}
            />
            </AreaChart>
        </ResponsiveContainer>
      </div>
      
        {/* Growth Stats */}
        <div className={`
          flex items-center justify-between p-3 md:p-4 rounded-xl
          ${growthStats.isPositive 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30'
          }
        `}>
          <div className="flex items-center gap-2">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-lg
              ${growthStats.isPositive 
                ? 'bg-emerald-100 dark:bg-emerald-800/30' 
                : 'bg-red-100 dark:bg-red-800/30'
              }
            `}>
              {growthStats.isPositive 
                ? <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                : <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              }
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Overall Growth</p>
              <p className={`text-sm font-bold ${growthStats.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {growthStats.percentage}
              </p>
            </div>
          </div>
          
          {growthStats.amount !== 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Change</p>
              <p className={`text-sm font-bold ${growthStats.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {growthStats.isPositive ? '+' : ''}{formatCurrency(growthStats.amount)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
