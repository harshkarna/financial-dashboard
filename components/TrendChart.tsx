'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
      
      // First, get all available months
      const monthsResponse = await fetch('/api/months')
      if (!monthsResponse.ok) throw new Error('Failed to fetch months')
      
      const monthsData = await monthsResponse.json()
      const availableMonths = monthsData.months || []
      
      // Get the most recent 5 months
      const recentMonths = availableMonths.slice(0, 5).reverse() // Reverse to show chronological order
      
      // Fetch net worth data for each month
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
      // Fallback to empty data
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

  const getGrowthPercentage = () => {
    if (chartData.length < 2) return 'N/A'
    const firstValue = chartData[0].netWorth
    const lastValue = chartData[chartData.length - 1].netWorth
    if (firstValue === 0) return 'N/A'
    const growth = ((lastValue - firstValue) / firstValue) * 100
    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`
  }

  const getGrowthColor = () => {
    if (chartData.length < 2) return 'bg-gray-500'
    const firstValue = chartData[0].netWorth
    const lastValue = chartData[chartData.length - 1].netWorth
    return lastValue >= firstValue ? 'bg-green-500' : 'bg-red-500'
  }

  const getGrowthTextColor = () => {
    if (chartData.length < 2) return 'text-gray-600 dark:text-gray-400'
    const firstValue = chartData[0].netWorth
    const lastValue = chartData[chartData.length - 1].netWorth
    return lastValue >= firstValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Net Worth: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Net Worth Trend</h2>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-gray-600 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Net Worth Trend</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monthly progression overview</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Last 5 months</span>
        </div>
      </div>
      
      <div className="h-72 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => value.split(' ')[0]}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={formatCurrency}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Line 
              type="monotone" 
              dataKey="netWorth" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ 
                fill: '#3B82F6', 
                strokeWidth: 3, 
                r: 5,
                stroke: '#ffffff'
              }}
              activeDot={{ 
                r: 8, 
                stroke: '#3B82F6', 
                strokeWidth: 3,
                fill: '#ffffff'
              }}
              fill="url(#colorGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getGrowthColor()}`}></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Growth:</span>
          </div>
          <span className={`font-bold text-lg ${getGrowthTextColor()}`}>{getGrowthPercentage()}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on {chartData.length}-month trend analysis</p>
      </div>
    </div>
  )
}