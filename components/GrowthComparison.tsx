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
  Coins,
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
  keyAssets: Record<string, { current: number; previous: number; change: number; percent: number }>
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

// Key Asset Icons
const KEY_ASSET_ICONS: Record<string, any> = {
  'Market Mutual Funds': BarChart3,
  'Market Value Stocks': TrendingUp,
  'Uber Vested RSU': Building2,
  'ServiceNow Vested RSU': Building2,
  'PF': PiggyBank,
  'Bank Savings': Wallet,
  'PPF': Coins,
  'default': Target
}

// Key Asset Colors
const KEY_ASSET_COLORS: Record<string, string> = {
  'Market Mutual Funds': 'from-purple-500 to-pink-500',
  'Market Value Stocks': 'from-blue-500 to-cyan-500',
  'Uber Vested RSU': 'from-amber-500 to-orange-500',
  'ServiceNow Vested RSU': 'from-green-500 to-emerald-500',
  'PF': 'from-emerald-500 to-teal-500',
  'Bank Savings': 'from-sky-500 to-blue-500',
  'PPF': 'from-rose-500 to-pink-500',
  'default': 'from-indigo-500 to-violet-500'
}

// Short display names for key assets
const KEY_ASSET_NAMES: Record<string, string> = {
  'Market Mutual Funds': 'Mutual Funds',
  'Market Value Stocks': 'Stocks',
  'Uber Vested RSU': 'Uber RSU',
  'ServiceNow Vested RSU': 'ServiceNow RSU',
  'PF': 'Provident Fund',
  'Bank Savings': 'Savings',
  'PPF': 'PPF'
}

export function GrowthComparison() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('mom')

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

        {/* Key Asset Insights - Grouped */}
        {currentComparison.keyAssets && Object.keys(currentComparison.keyAssets).length > 0 && (() => {
          // Group assets by category (order matters for display)
          const marketAssets = ['Market Value Stocks', 'Market Mutual Funds']
          const rsuAssets = ['ServiceNow Vested RSU', 'Uber Vested RSU']
          const savingsAssets = ['PF', 'Bank Savings', 'PPF']
          
          const renderAssetCard = (assetName: string, data: { current: number; previous: number; change: number; percent: number }) => {
            const Icon = KEY_ASSET_ICONS[assetName] || KEY_ASSET_ICONS.default
            const colorClass = KEY_ASSET_COLORS[assetName] || KEY_ASSET_COLORS.default
            const displayName = KEY_ASSET_NAMES[assetName] || assetName
            const isPositive = data.change >= 0
            
            return (
              <div 
                key={assetName} 
                className={`
                  relative overflow-hidden rounded-xl p-4 border transition-all hover:scale-[1.02]
                  ${isPositive 
                    ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-emerald-500/30 hover:border-emerald-500/50' 
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-red-500/30 hover:border-red-500/50'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center shadow-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-white text-sm truncate">{displayName}</span>
                </div>
                
                <div className="space-y-1">
                  <p className={`text-xl font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatChange(data.change)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatCurrency(data.current)}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {formatPercent(data.percent)}
                    </span>
                  </div>
                </div>
                
                {/* Decorative gradient */}
                <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br ${colorClass}`} />
              </div>
            )
          }
          
          const getGroupAssets = (group: string[]) => 
            group.filter(name => currentComparison.keyAssets[name])
                 .map(name => ({ name, data: currentComparison.keyAssets[name] }))
          
          const marketData = getGroupAssets(marketAssets)
          const rsuData = getGroupAssets(rsuAssets)
          const savingsData = getGroupAssets(savingsAssets)
          
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-white">Key Investment Growth</span>
              </div>
              
              {/* Market Investments Row */}
              {marketData.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 pl-1">Market Investments</p>
                  <div className="grid grid-cols-2 gap-3">
                    {marketData.map(({ name, data }) => renderAssetCard(name, data))}
                  </div>
                </div>
              )}
              
              {/* RSU Row */}
              {rsuData.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 pl-1">RSU Holdings</p>
                  <div className="grid grid-cols-2 gap-3">
                    {rsuData.map(({ name, data }) => renderAssetCard(name, data))}
                  </div>
                </div>
              )}
              
              {/* Savings & Retirement Row */}
              {savingsData.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 pl-1">Savings & Retirement</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {savingsData.map(({ name, data }) => renderAssetCard(name, data))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

      </div>
    </div>
  )
}
