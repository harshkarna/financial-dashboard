'use client'

import { useEffect, useState } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
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
      
      const recentMonths = availableMonths.slice(0, 6).reverse()
      
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
        <div className="bg-slate-800 px-4 py-3 border border-blue-500/30 rounded-xl shadow-xl shadow-blue-500/10">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-lg font-bold text-blue-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="glass-dark rounded-2xl glow-blue p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700/50 rounded-lg w-40" />
          <div className="h-56 bg-slate-700/50 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="glass-dark rounded-2xl glow-blue overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Net Worth Trend</h2>
              <p className="text-xs text-slate-400">Monthly progression</p>
            </div>
          </div>
      
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30">
              Last {chartData.length} months
            </span>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-56 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.2)" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(value) => value.split(' ')[0]}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={formatShort}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fill="url(#colorGradient)"
                dot={{ 
                  fill: '#3B82F6', 
                  strokeWidth: 3, 
                  r: 5,
                  stroke: '#1e293b'
                }}
                activeDot={{ 
                  r: 7, 
                  stroke: '#3B82F6', 
                  strokeWidth: 3,
                  fill: '#1e293b'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      
        {/* Growth Stats */}
        <div className={`
          flex items-center justify-between p-4 rounded-xl
          ${growthStats.isPositive 
            ? 'bg-gradient-to-r from-emerald-900/40 to-green-900/30 border border-emerald-500/30' 
            : 'bg-gradient-to-r from-red-900/40 to-rose-900/30 border border-red-500/30'
          }
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-xl
              ${growthStats.isPositive 
                ? 'bg-emerald-500/20 border border-emerald-500/30' 
                : 'bg-red-500/20 border border-red-500/30'
              }
            `}>
              {growthStats.isPositive 
                ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                : <TrendingDown className="w-5 h-5 text-red-400" />
              }
            </div>
            <div>
              <p className="text-xs text-slate-400">Overall Growth</p>
              <p className={`text-xl font-black ${growthStats.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {growthStats.percentage}
              </p>
            </div>
          </div>
          
          {growthStats.amount !== 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Change</p>
              <p className={`text-lg font-bold ${growthStats.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {growthStats.isPositive ? '+' : ''}{formatCurrency(growthStats.amount)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
