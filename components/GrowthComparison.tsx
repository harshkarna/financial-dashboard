'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Wallet,
  CreditCard,
  Building2,
  PiggyBank,
  Car,
  Coins,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'

interface ComparisonData {
  period: string
  fromMonth: string
  toMonth: string
  netWorth: { current: number; previous: number; change: number; percent: number }
  assets: { current: number; previous: number; change: number; percent: number }
  liabilities: { current: number; previous: number; change: number; percent: number }
  byType: Record<string, { current: number; previous: number; change: number; percent: number }>
  topChanges: Array<{ item: string; type: string; change: number; percent: number; current: number }>
  topGainers: Array<{ item: string; type: string; change: number; percent: number; current: number }>
  topLosers: Array<{ item: string; type: string; change: number; percent: number; current: number }>
}

interface ApiResponse {
  comparisons: {
    mom: ComparisonData | null
    twoMonth: ComparisonData | null
    threeMonth: ComparisonData | null
    sixMonth: ComparisonData | null
  }
}

type PeriodKey = 'mom' | 'twoMonth' | 'threeMonth' | 'sixMonth'

const TYPE_ICONS: Record<string, any> = {
  'Liquid Asset': Wallet,
  'Investment': BarChart3,
  'Non-liquid': Building2,
  'Depreciating': Car,
  'Other Asset': Coins,
  'default': PiggyBank
}

const TYPE_COLORS: Record<string, string> = {
  'Liquid Asset': 'from-blue-500 to-cyan-500',
  'Investment': 'from-purple-500 to-pink-500',
  'Non-liquid': 'from-amber-500 to-orange-500',
  'Depreciating': 'from-slate-500 to-gray-500',
  'Other Asset': 'from-emerald-500 to-teal-500',
  'default': 'from-indigo-500 to-blue-500'
}

export function GrowthComparison() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('mom')
  const [expandedTypes, setExpandedTypes] = useState(false)

  useEffect(() => {
    fetchComparisonData()
  }, [])

  const fetchComparisonData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/comparison')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
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
    return `₹${value.toFixed(0)}`
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${formatCurrency(value)}`
  }

  const periods: { key: PeriodKey; label: string }[] = [
    { key: 'mom', label: '1M' },
    { key: 'twoMonth', label: '2M' },
    { key: 'threeMonth', label: '3M' },
    { key: 'sixMonth', label: '6M' }
  ]

  const currentComparison = data?.comparisons?.[selectedPeriod]

  if (loading) {
    return (
      <div className="glass-dark rounded-2xl p-5 glow-purple">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700/50 rounded-lg w-48" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-slate-700/50 rounded-xl" />
            <div className="h-24 bg-slate-700/50 rounded-xl" />
            <div className="h-24 bg-slate-700/50 rounded-xl" />
          </div>
          <div className="h-40 bg-slate-700/50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!currentComparison) {
    return (
      <div className="glass-dark rounded-2xl p-6 glow-purple">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Growth Comparison</h2>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Not enough data for comparison</p>
          <p className="text-sm mt-1">Add more months to see growth trends</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-dark rounded-2xl overflow-hidden glow-purple">
      <div className="p-5">
        {/* Header with Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Growth Comparison</h2>
              <p className="text-xs text-slate-400">
                {currentComparison.fromMonth} → {currentComparison.toMonth}
              </p>
            </div>
          </div>
          
          {/* Period Tabs */}
          <div className="flex bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            {periods.map(({ key, label }) => {
              const isAvailable = data?.comparisons?.[key]
              return (
                <button
                  key={key}
                  onClick={() => isAvailable && setSelectedPeriod(key)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
                    ${selectedPeriod === key 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : isAvailable 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                        : 'text-slate-600 cursor-not-allowed'
                    }
                  `}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Net Worth Card */}
          <div className={`
            relative overflow-hidden rounded-xl p-4
            ${currentComparison.netWorth.change >= 0 
              ? 'bg-gradient-to-br from-emerald-900/40 to-green-900/30 border border-emerald-500/30' 
              : 'bg-gradient-to-br from-red-900/40 to-rose-900/30 border border-red-500/30'
            }
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Net Worth</span>
              <div className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                ${currentComparison.netWorth.change >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
                }
              `}>
                {currentComparison.netWorth.change >= 0 
                  ? <ArrowUpRight className="w-3 h-3" />
                  : <ArrowDownRight className="w-3 h-3" />
                }
                {formatPercent(currentComparison.netWorth.percent)}
              </div>
            </div>
            <p className={`text-2xl font-black ${currentComparison.netWorth.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatChange(currentComparison.netWorth.change)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(currentComparison.netWorth.previous)} → {formatCurrency(currentComparison.netWorth.current)}
            </p>
            <Sparkles className={`absolute -right-2 -top-2 w-16 h-16 ${currentComparison.netWorth.change >= 0 ? 'text-emerald-500/10' : 'text-red-500/10'}`} />
          </div>

          {/* Assets Card */}
          <div className={`
            relative overflow-hidden rounded-xl p-4
            ${currentComparison.assets.change >= 0 
              ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/30 border border-blue-500/30' 
              : 'bg-gradient-to-br from-orange-900/40 to-amber-900/30 border border-orange-500/30'
            }
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Assets</span>
              <div className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                ${currentComparison.assets.change >= 0 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-orange-500/20 text-orange-400'
                }
              `}>
                {currentComparison.assets.change >= 0 
                  ? <ArrowUpRight className="w-3 h-3" />
                  : <ArrowDownRight className="w-3 h-3" />
                }
                {formatPercent(currentComparison.assets.percent)}
              </div>
            </div>
            <p className={`text-2xl font-black ${currentComparison.assets.change >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {formatChange(currentComparison.assets.change)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(currentComparison.assets.previous)} → {formatCurrency(currentComparison.assets.current)}
            </p>
            <Wallet className={`absolute -right-2 -top-2 w-16 h-16 ${currentComparison.assets.change >= 0 ? 'text-blue-500/10' : 'text-orange-500/10'}`} />
          </div>

          {/* Liabilities Card */}
          <div className={`
            relative overflow-hidden rounded-xl p-4
            ${currentComparison.liabilities.change <= 0 
              ? 'bg-gradient-to-br from-emerald-900/40 to-green-900/30 border border-emerald-500/30' 
              : 'bg-gradient-to-br from-red-900/40 to-rose-900/30 border border-red-500/30'
            }
          `}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Liabilities</span>
              <div className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                ${currentComparison.liabilities.change <= 0 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
                }
              `}>
                {currentComparison.liabilities.change <= 0 
                  ? <ArrowDownRight className="w-3 h-3" />
                  : <ArrowUpRight className="w-3 h-3" />
                }
                {formatPercent(Math.abs(currentComparison.liabilities.percent))}
              </div>
            </div>
            <p className={`text-2xl font-black ${currentComparison.liabilities.change <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentComparison.liabilities.change === 0 ? '₹0' : formatChange(currentComparison.liabilities.change)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(currentComparison.liabilities.previous)} → {formatCurrency(currentComparison.liabilities.current)}
            </p>
            <CreditCard className={`absolute -right-2 -top-2 w-16 h-16 ${currentComparison.liabilities.change <= 0 ? 'text-emerald-500/10' : 'text-red-500/10'}`} />
          </div>
        </div>

        {/* Asset Type Breakdown */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
          <button 
            onClick={() => setExpandedTypes(!expandedTypes)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white">Asset Type Breakdown</span>
              <span className="text-xs text-slate-500">({Object.keys(currentComparison.byType).length} categories)</span>
            </div>
            {expandedTypes ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {expandedTypes && (
            <div className="p-4 pt-0 space-y-3">
              {Object.entries(currentComparison.byType)
                .sort((a, b) => b[1].current - a[1].current)
                .map(([type, data]) => {
                  const Icon = TYPE_ICONS[type] || TYPE_ICONS.default
                  const colorClass = TYPE_COLORS[type] || TYPE_COLORS.default
                  const isPositive = data.change >= 0
                  
                  return (
                    <div key={type} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/30">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white truncate">{type}</span>
                          <span className="text-sm text-slate-400">{formatCurrency(data.current)}</span>
                        </div>
                        
                        {/* Progress bar showing change */}
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ 
                              width: `${Math.min(Math.abs(data.percent), 100)}%`,
                              minWidth: data.change !== 0 ? '4px' : '0px'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatChange(data.change)}
                        </p>
                        <p className={`text-xs ${isPositive ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                          {formatPercent(data.percent)}
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Top Movers */}
        {(currentComparison.topGainers.length > 0 || currentComparison.topLosers.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Top Gainers */}
            {currentComparison.topGainers.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-400 text-sm">Top Gainers</span>
                </div>
                <div className="space-y-2">
                  {currentComparison.topGainers.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-emerald-500/10 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate">{item.item}</p>
                        <p className="text-xs text-slate-500">{item.type}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-emerald-400 font-bold text-sm">{formatChange(item.change)}</p>
                        <p className="text-emerald-400/70 text-xs">{formatPercent(item.percent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Losers */}
            {currentComparison.topLosers.length > 0 && (
              <div className="bg-gradient-to-br from-red-900/30 to-rose-900/20 rounded-xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="font-semibold text-red-400 text-sm">Top Decliners</span>
                </div>
                <div className="space-y-2">
                  {currentComparison.topLosers.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-red-500/10 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate">{item.item}</p>
                        <p className="text-xs text-slate-500">{item.type}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-red-400 font-bold text-sm">{formatChange(item.change)}</p>
                        <p className="text-red-400/70 text-xs">{formatPercent(item.percent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
