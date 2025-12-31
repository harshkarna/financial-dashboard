'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface StockHolding {
  symbol: string
  exchange: string
  isin: string
  quantity: number
  avgPrice: number
  lastPrice: number
  closePrice: number
  invested: number
  currentValue: number
  pnl: number
  pnlPercent: number
  dayChange: number
  dayChangePercent: number
}

interface MFHolding {
  symbol: string
  name: string
  folio: string
  quantity: number
  avgPrice: number
  lastPrice: number
  lastPriceDate: string
  invested: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

interface StocksSummary {
  totalInvestment: number
  totalCurrentValue: number
  totalPnL: number
  overallReturnPercent: number
  totalDayChange: number
  dayChangePercent: number
  stockCount: number
}

interface MFSummary {
  totalInvestment: number
  totalCurrentValue: number
  totalPnL: number
  overallReturnPercent: number
  fundCount: number
}

interface FundsSummary {
  totalAvailable: number
  totalCash: number
  equityNet: number
  commodityNet: number
}

interface ConnectionStatus {
  isConnected: boolean
  userName: string | null
  expiresAt: string | null
  message: string
}

type TabType = 'all' | 'stocks' | 'mutualfunds'
type RowsPerPage = 10 | 25 | 50 | 'all'

// Vibrant distinct colors for stocks
const STOCK_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]

// Vibrant distinct colors for MFs
const MF_COLORS = [
  '#A855F7', // Purple
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#F43F5E', // Rose
  '#6366F1', // Indigo
  '#22C55E', // Green
  '#0EA5E9', // Sky
  '#FBBF24', // Yellow
]

function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`
    }
    if (Math.abs(value) >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`
    }
    if (Math.abs(value) >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// Get readable MF name
function getMFDisplayName(holding: MFHolding): string {
  if (holding.name && holding.name.length > 3 && !holding.name.startsWith('INF')) {
    return holding.name
  }
  // Fallback: format ISIN to something readable
  const symbol = holding.symbol
  if (symbol.includes('-')) {
    return symbol.split('-').slice(0, 2).join(' ')
  }
  return symbol
}

export function Investments() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [stockHoldings, setStockHoldings] = useState<StockHolding[]>([])
  const [mfHoldings, setMfHoldings] = useState<MFHolding[]>([])
  const [stocksSummary, setStocksSummary] = useState<StocksSummary | null>(null)
  const [mfSummary, setMfSummary] = useState<MFSummary | null>(null)
  const [funds, setFunds] = useState<FundsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [stockSortField, setStockSortField] = useState<string>('currentValue')
  const [stockSortDirection, setStockSortDirection] = useState<'asc' | 'desc'>('desc')
  const [mfSortField, setMfSortField] = useState<string>('currentValue')
  const [mfSortDirection, setMfSortDirection] = useState<'asc' | 'desc'>('desc')
  const [stocksRowsPerPage, setStocksRowsPerPage] = useState<RowsPerPage>(10)
  const [mfRowsPerPage, setMfRowsPerPage] = useState<RowsPerPage>(10)

  useEffect(() => {
    checkStatus()
  }, [])

  useEffect(() => {
    if (status?.isConnected) {
      fetchData()
    }
  }, [status?.isConnected])

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/zerodha/status')
      const data = await res.json()
      setStatus(data)
      setLoading(false)
    } catch {
      setError('Failed to check Zerodha connection status')
      setLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [holdingsRes, mfRes, fundsRes] = await Promise.all([
        fetch('/api/zerodha/holdings'),
        fetch('/api/zerodha/mf-holdings'),
        fetch('/api/zerodha/funds'),
      ])

      const holdingsData = await holdingsRes.json()
      const mfData = await mfRes.json()
      const fundsData = await fundsRes.json()

      setStockHoldings(holdingsData.holdings || [])
      setStocksSummary(holdingsData.summary)
      setMfHoldings(mfData.holdings || [])
      setMfSummary(mfData.summary)
      setFunds(fundsData.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = '/api/zerodha/login'
  }

  const handleDisconnect = async () => {
    try {
      await fetch('/api/zerodha/status', { method: 'DELETE' })
      setStatus({ isConnected: false, userName: null, expiresAt: null, message: 'Disconnected' })
      setStockHoldings([])
      setMfHoldings([])
      setStocksSummary(null)
      setMfSummary(null)
      setFunds(null)
    } catch {
      setError('Failed to disconnect')
    }
  }

  const handleStockSort = (field: string) => {
    if (stockSortField === field) {
      setStockSortDirection(stockSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setStockSortField(field)
      setStockSortDirection('desc')
    }
  }

  const handleMfSort = (field: string) => {
    if (mfSortField === field) {
      setMfSortDirection(mfSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setMfSortField(field)
      setMfSortDirection('desc')
    }
  }

  // Combined totals
  const totalInvestment = (stocksSummary?.totalInvestment || 0) + (mfSummary?.totalInvestment || 0)
  const totalCurrentValue = (stocksSummary?.totalCurrentValue || 0) + (mfSummary?.totalCurrentValue || 0)
  const totalPnL = (stocksSummary?.totalPnL || 0) + (mfSummary?.totalPnL || 0)
  const overallReturnPercent = totalInvestment > 0 ? ((totalCurrentValue - totalInvestment) / totalInvestment) * 100 : 0
  const totalDayChange = stocksSummary?.totalDayChange || 0
  const dayChangePercent = stocksSummary?.dayChangePercent || 0

  // Sort holdings
  const sortedStocks = [...stockHoldings].sort((a, b) => {
    const aVal = a[stockSortField as keyof StockHolding]
    const bVal = b[stockSortField as keyof StockHolding]
    const multiplier = stockSortDirection === 'asc' ? 1 : -1
    return typeof aVal === 'number' && typeof bVal === 'number'
      ? (aVal - bVal) * multiplier
      : String(aVal).localeCompare(String(bVal)) * multiplier
  })

  const sortedMFs = [...mfHoldings].sort((a, b) => {
    // Handle special sort for calculated P&L
    if (mfSortField === 'pnl') {
      const aPnL = a.currentValue - a.invested
      const bPnL = b.currentValue - b.invested
      return mfSortDirection === 'asc' ? aPnL - bPnL : bPnL - aPnL
    }
    if (mfSortField === 'pnlPercent') {
      const aPnLPercent = a.invested > 0 ? ((a.currentValue - a.invested) / a.invested) * 100 : 0
      const bPnLPercent = b.invested > 0 ? ((b.currentValue - b.invested) / b.invested) * 100 : 0
      return mfSortDirection === 'asc' ? aPnLPercent - bPnLPercent : bPnLPercent - aPnLPercent
    }
    const aVal = a[mfSortField as keyof MFHolding]
    const bVal = b[mfSortField as keyof MFHolding]
    const multiplier = mfSortDirection === 'asc' ? 1 : -1
    return typeof aVal === 'number' && typeof bVal === 'number'
      ? (aVal - bVal) * multiplier
      : String(aVal).localeCompare(String(bVal)) * multiplier
  })

  // Get displayed stocks based on rows per page
  const displayedStocks = stocksRowsPerPage === 'all' 
    ? sortedStocks 
    : sortedStocks.slice(0, stocksRowsPerPage)

  // Get displayed MFs based on rows per page
  const displayedMFs = mfRowsPerPage === 'all' 
    ? sortedMFs 
    : sortedMFs.slice(0, mfRowsPerPage)

  // Pie chart data
  const stockPieData = stockHoldings
    .map(h => ({ name: h.symbol, value: h.currentValue }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const mfPieData = mfHoldings
    .map(h => ({ name: getMFDisplayName(h).slice(0, 15), value: h.currentValue }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Combined gainers/losers with proper names and calculated P&L for MFs
  const allHoldings = [
    ...stockHoldings.map(h => ({ 
      ...h, 
      type: 'Stock' as const,
      displayName: h.symbol,
      calculatedPnL: h.pnl,
      calculatedPnLPercent: h.pnlPercent,
    })),
    ...mfHoldings.map(h => {
      const calcPnL = h.currentValue - h.invested
      const calcPnLPercent = h.invested > 0 ? (calcPnL / h.invested) * 100 : 0
      return { 
        ...h, 
        type: 'MF' as const, 
        dayChange: 0, 
        dayChangePercent: 0,
        displayName: getMFDisplayName(h),
        calculatedPnL: calcPnL,
        calculatedPnLPercent: calcPnLPercent,
      }
    })
  ]

  // Not connected state
  if (!loading && !status?.isConnected) {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-10 shadow-2xl border border-gray-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-red-500/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative text-center max-w-lg mx-auto">
            <div className="w-28 h-28 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl shadow-orange-500/30 transform hover:scale-105 transition-transform">
              <span className="text-5xl">📊</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Connect Your Zerodha Account
            </h2>
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
              Link your Zerodha account to view your complete portfolio, real-time P&L, and investment analytics.
            </p>
            
            <button
              onClick={handleLogin}
              className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Connect with Zerodha
            </button>

            <div className="mt-10 p-5 bg-amber-500/10 backdrop-blur rounded-2xl border border-amber-500/20">
              <p className="text-amber-200/80 text-sm">
                <span className="font-semibold text-amber-200">Note:</span> Token expires daily at 6 AM IST
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '💼', title: 'Portfolio Value', desc: 'Stocks + Mutual Funds', color: 'from-blue-500/20 to-cyan-500/20' },
            { icon: '📈', title: 'P&L Analytics', desc: 'Day & All-time returns', color: 'from-green-500/20 to-emerald-500/20' },
            { icon: '🏦', title: 'Mutual Funds', desc: 'Coin MF holdings', color: 'from-purple-500/20 to-pink-500/20' },
            { icon: '💰', title: 'Available Funds', desc: 'Cash & margins', color: 'from-amber-500/20 to-orange-500/20' },
          ].map((item, i) => (
            <div key={i} className={`bg-gradient-to-br ${item.color} backdrop-blur rounded-2xl p-5 border border-white/10 opacity-60`}>
              <span className="text-3xl mb-3 block">{item.icon}</span>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur">
        <div className="flex items-center">
          <span className="text-3xl mr-4">⚠️</span>
          <div>
            <h3 className="font-bold text-red-400 text-lg">Error Loading Portfolio</h3>
            <p className="text-red-300/80">{error}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={fetchData} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
            Retry
          </button>
          <button onClick={handleLogin} className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-xl font-medium hover:bg-gray-600 transition-colors">
            Re-authenticate
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur rounded-2xl p-4 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
          </div>
          <span className="text-emerald-200 font-medium">
            Connected as <strong className="text-emerald-100">{status?.userName}</strong>
          </span>
          {status?.expiresAt && (
            <span className="text-emerald-400/70 text-sm hidden md:inline">
              • Expires {new Date(status.expiresAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-xl transition-colors" title="Refresh">
            🔄
          </button>
          <button onClick={handleDisconnect} className="text-sm text-emerald-400 hover:text-emerald-200 font-medium">
            Disconnect
          </button>
        </div>
      </div>

      {/* Hero Stats - Premium Design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Portfolio - Large Card */}
        <div className="lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">Total Portfolio</span>
              <span className="text-2xl">💎</span>
            </div>
            <div className="text-4xl font-black text-white mb-2 tracking-tight">
              {formatCurrency(totalCurrentValue, true)}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-lg font-medium">
                {stocksSummary?.stockCount || 0} Stocks
              </span>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg font-medium">
                {mfSummary?.fundCount || 0} MFs
              </span>
            </div>
          </div>
        </div>

        {/* P&L Cards - Day & Overall */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Today's P&L */}
          <div className={`relative overflow-hidden rounded-2xl p-5 border shadow-xl ${
            totalDayChange >= 0 
              ? 'bg-gradient-to-br from-emerald-900/50 to-green-900/30 border-emerald-500/30'
              : 'bg-gradient-to-br from-red-900/50 to-rose-900/30 border-red-500/30'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium uppercase tracking-wide ${totalDayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Today's P&L
                </span>
                <span className="text-xl">{totalDayChange >= 0 ? '📈' : '📉'}</span>
              </div>
              <div className={`text-3xl font-black mb-1 ${totalDayChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {totalDayChange >= 0 ? '+' : ''}{formatCurrency(totalDayChange, true)}
              </div>
              <div className={`text-lg font-bold ${totalDayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercent(dayChangePercent)}
              </div>
              <div className="text-xs text-slate-500 mt-2">Stocks only (MF NAV updates daily)</div>
            </div>
          </div>

          {/* Overall P&L */}
          <div className={`relative overflow-hidden rounded-2xl p-5 border shadow-xl ${
            totalPnL >= 0 
              ? 'bg-gradient-to-br from-blue-900/50 to-indigo-900/30 border-blue-500/30'
              : 'bg-gradient-to-br from-orange-900/50 to-amber-900/30 border-orange-500/30'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium uppercase tracking-wide ${totalPnL >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                  All-Time P&L
                </span>
                <span className="text-xl">{totalPnL >= 0 ? '🚀' : '💔'}</span>
              </div>
              <div className={`text-3xl font-black mb-1 ${totalPnL >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL, true)}
              </div>
              <div className={`text-lg font-bold ${totalPnL >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                {formatPercent(overallReturnPercent)}
              </div>
              <div className="text-xs text-slate-500 mt-2">On ₹{formatCurrency(totalInvestment, true)} invested</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stocks vs MF Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stocks Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-cyan-900/20 rounded-2xl p-5 border border-blue-500/30 shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Stocks</h3>
                <p className="text-blue-300/70 text-sm">{stocksSummary?.stockCount || 0} holdings</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-blue-300/60 text-xs uppercase tracking-wide">Current Value</span>
                <div className="text-xl font-bold text-white">{formatCurrency(stocksSummary?.totalCurrentValue || 0, true)}</div>
              </div>
              <div>
                <span className="text-blue-300/60 text-xs uppercase tracking-wide">P&L</span>
                <div className={`text-xl font-bold ${(stocksSummary?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(stocksSummary?.totalPnL || 0, true)}
                  <span className="text-sm ml-1">({formatPercent(stocksSummary?.overallReturnPercent || 0)})</span>
                </div>
              </div>
              <div>
                <span className="text-blue-300/60 text-xs uppercase tracking-wide">Invested</span>
                <div className="text-lg text-slate-300">{formatCurrency(stocksSummary?.totalInvestment || 0, true)}</div>
              </div>
              <div>
                <span className="text-blue-300/60 text-xs uppercase tracking-wide">Day Change</span>
                <div className={`text-lg font-semibold ${(stocksSummary?.totalDayChange || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(stocksSummary?.totalDayChange || 0, true)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MF Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/20 rounded-2xl p-5 border border-purple-500/30 shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <span className="text-xl">🏦</span>
              </div>
              <div>
                <h3 className="font-bold text-white">Mutual Funds</h3>
                <p className="text-purple-300/70 text-sm">{mfSummary?.fundCount || 0} funds</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-purple-300/60 text-xs uppercase tracking-wide">Current Value</span>
                <div className="text-xl font-bold text-white">{formatCurrency(mfSummary?.totalCurrentValue || 0, true)}</div>
              </div>
              <div>
                <span className="text-purple-300/60 text-xs uppercase tracking-wide">Total P&L</span>
                {(() => {
                  // Calculate P&L from current value - investment
                  const mfPnL = (mfSummary?.totalCurrentValue || 0) - (mfSummary?.totalInvestment || 0)
                  const mfPnLPercent = (mfSummary?.totalInvestment || 0) > 0 
                    ? (mfPnL / (mfSummary?.totalInvestment || 1)) * 100 
                    : 0
                  return (
                    <div className={`text-xl font-bold ${mfPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(mfPnL, true)}
                      <span className="text-sm ml-1">({formatPercent(mfPnLPercent)})</span>
                    </div>
                  )
                })()}
              </div>
              <div>
                <span className="text-purple-300/60 text-xs uppercase tracking-wide">Invested</span>
                <div className="text-lg text-slate-300">{formatCurrency(mfSummary?.totalInvestment || 0, true)}</div>
              </div>
              <div>
                <span className="text-purple-300/60 text-xs uppercase tracking-wide">Absolute Return</span>
                {(() => {
                  const absReturn = (mfSummary?.totalInvestment || 0) > 0 
                    ? (((mfSummary?.totalCurrentValue || 0) - (mfSummary?.totalInvestment || 0)) / (mfSummary?.totalInvestment || 1)) * 100 
                    : 0
                  return (
                    <div className={`text-lg font-semibold ${absReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatPercent(absReturn)}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Funds */}
      {funds && (
        <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-2xl p-5 border border-amber-500/30 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/30 rounded-xl flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <h3 className="font-bold text-white">Available Funds</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/20 rounded-xl p-4">
              <span className="text-amber-300/60 text-xs uppercase tracking-wide">Total Available</span>
              <div className="text-2xl font-bold text-amber-200">{formatCurrency(funds.totalAvailable)}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <span className="text-amber-300/60 text-xs uppercase tracking-wide">Cash</span>
              <div className="text-xl font-bold text-white">{formatCurrency(funds.totalCash)}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <span className="text-amber-300/60 text-xs uppercase tracking-wide">Equity Margin</span>
              <div className="text-xl font-bold text-white">{formatCurrency(funds.equityNet)}</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <span className="text-amber-300/60 text-xs uppercase tracking-wide">Commodity</span>
              <div className="text-xl font-bold text-white">{formatCurrency(funds.commodityNet)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl w-fit border border-slate-700/50">
        {[
          { id: 'all', label: 'All Holdings', icon: '📊' },
          { id: 'stocks', label: 'Stocks', icon: '📈' },
          { id: 'mutualfunds', label: 'Mutual Funds', icon: '🏦' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stocks Pie Chart */}
        {(activeTab === 'all' || activeTab === 'stocks') && stockPieData.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              📈 Stock Allocation
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {stockPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Value']}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {stockPieData.slice(0, 6).map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STOCK_COLORS[i] }}></span>
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* MF Pie Chart */}
        {(activeTab === 'all' || activeTab === 'mutualfunds') && mfPieData.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              🏦 Mutual Fund Allocation
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mfPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {mfPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={MF_COLORS[index % MF_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Value']}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {mfPieData.slice(0, 6).map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MF_COLORS[i] }}></span>
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* P&L Summary Cards */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          📊 P&L Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stocks P&L */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-5 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📈</span>
              <span className="font-semibold text-blue-200">Stocks P&L</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-blue-300/70 uppercase">Total P&L</span>
                <div className={`text-xl font-bold ${(stocksSummary?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(stocksSummary?.totalPnL || 0, true)}
                </div>
                <div className={`text-sm ${(stocksSummary?.overallReturnPercent || 0) >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                  {formatPercent(stocksSummary?.overallReturnPercent || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs text-blue-300/70 uppercase">Today's P&L</span>
                <div className={`text-xl font-bold ${(stocksSummary?.totalDayChange || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(stocksSummary?.totalDayChange || 0, true)}
                </div>
                <div className={`text-sm ${(stocksSummary?.dayChangePercent || 0) >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                  {formatPercent(stocksSummary?.dayChangePercent || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* MF P&L */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-5 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏦</span>
              <span className="font-semibold text-purple-200">Mutual Funds P&L</span>
            </div>
            {(() => {
              const mfPnL = (mfSummary?.totalCurrentValue || 0) - (mfSummary?.totalInvestment || 0)
              const mfPnLPercent = (mfSummary?.totalInvestment || 0) > 0 
                ? (mfPnL / (mfSummary?.totalInvestment || 1)) * 100 
                : 0
              return (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-purple-300/70 uppercase">Total P&L</span>
                    <div className={`text-xl font-bold ${mfPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(mfPnL, true)}
                    </div>
                    <div className={`text-sm ${mfPnLPercent >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                      {formatPercent(mfPnLPercent)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-purple-300/70 uppercase">Absolute Return</span>
                    <div className={`text-xl font-bold ${mfPnLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatPercent(mfPnLPercent)}
                    </div>
                    <div className="text-xs text-slate-500">
                      On {formatCurrency(mfSummary?.totalInvestment || 0, true)}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
        
        {/* Visual Bar Comparison */}
        {(() => {
          const stockPnL = stocksSummary?.totalPnL || 0
          const mfPnL = (mfSummary?.totalCurrentValue || 0) - (mfSummary?.totalInvestment || 0)
          const maxPnL = Math.max(Math.abs(stockPnL), Math.abs(mfPnL), 1)
          
          return (
            <div className="mt-6">
              <div className="text-sm text-slate-400 mb-3">Total P&L Comparison</div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-300">Stocks</span>
                    <span className={`font-semibold ${stockPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(stockPnL, true)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${stockPnL >= 0 ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-red-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(stockPnL) / maxPnL * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-300">Mutual Funds</span>
                    <span className={`font-semibold ${mfPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(mfPnL, true)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${mfPnL >= 0 ? 'bg-gradient-to-r from-purple-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-red-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(mfPnL) / maxPnL * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Holdings Tables */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
        {/* Stocks Table */}
        {(activeTab === 'all' || activeTab === 'stocks') && stockHoldings.length > 0 && (
          <>
            <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  📈 Stocks ({stockHoldings.length})
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Sort By */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Sort by:</span>
                    <select
                      value={stockSortField}
                      onChange={(e) => setStockSortField(e.target.value)}
                      className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="symbol">Name</option>
                      <option value="currentValue">Value</option>
                      <option value="pnl">P&L</option>
                      <option value="pnlPercent">P&L %</option>
                      <option value="dayChange">Day Change</option>
                      <option value="dayChangePercent">Day %</option>
                      <option value="quantity">Quantity</option>
                    </select>
                    <button
                      onClick={() => setStockSortDirection(stockSortDirection === 'asc' ? 'desc' : 'asc')}
                      className="p-1.5 bg-slate-800 text-slate-300 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
                      title={stockSortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {stockSortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  {/* Rows Per Page */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Show:</span>
                    <select
                      value={stocksRowsPerPage}
                      onChange={(e) => setStocksRowsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value) as RowsPerPage)}
                      className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value="all">All ({stockHoldings.length})</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 sticky top-0">
                  <tr>
                    {[
                      { key: 'symbol', label: 'Stock' },
                      { key: 'quantity', label: 'Qty' },
                      { key: 'avgPrice', label: 'Avg' },
                      { key: 'lastPrice', label: 'LTP' },
                      { key: 'currentValue', label: 'Value' },
                      { key: 'pnl', label: 'P&L' },
                      { key: 'dayChange', label: 'Day' },
                    ].map(col => (
                      <th 
                        key={col.key} 
                        onClick={() => handleStockSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {stockSortField === col.key && (
                            <span className="text-blue-400">{stockSortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {displayedStocks.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{h.symbol}</div>
                        <div className="text-xs text-slate-500">{h.exchange}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{h.quantity}</td>
                      <td className="px-4 py-3 text-slate-300">₹{h.avgPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">₹{h.lastPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-white">{formatCurrency(h.currentValue)}</td>
                      <td className={`px-4 py-3 font-semibold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(h.pnl)}
                        <div className="text-xs opacity-70">{formatPercent(h.pnlPercent)}</div>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${h.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(h.dayChange)}
                        <div className="text-xs opacity-70">{formatPercent(h.dayChangePercent)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Show more indicator */}
            {stocksRowsPerPage !== 'all' && stockHoldings.length > stocksRowsPerPage && (
              <div className="p-3 text-center border-t border-slate-700/50 bg-slate-800/30">
                <button
                  onClick={() => setStocksRowsPerPage('all')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  Show all {stockHoldings.length} stocks →
                </button>
              </div>
            )}
          </>
        )}

        {/* MF Table */}
        {(activeTab === 'all' || activeTab === 'mutualfunds') && mfHoldings.length > 0 && (
          <>
            <div className={`p-5 border-b border-slate-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 ${activeTab === 'all' && stockHoldings.length > 0 ? 'border-t' : ''}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🏦 Mutual Funds ({mfHoldings.length})
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Sort By */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Sort by:</span>
                    <select
                      value={mfSortField}
                      onChange={(e) => setMfSortField(e.target.value)}
                      className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-purple-500"
                    >
                      <option value="name">Name</option>
                      <option value="currentValue">Value</option>
                      <option value="pnl">P&L</option>
                      <option value="pnlPercent">P&L %</option>
                      <option value="invested">Invested</option>
                      <option value="quantity">Units</option>
                    </select>
                    <button
                      onClick={() => setMfSortDirection(mfSortDirection === 'asc' ? 'desc' : 'asc')}
                      className="p-1.5 bg-slate-800 text-slate-300 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors"
                      title={mfSortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {mfSortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  {/* Rows Per Page */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Show:</span>
                    <select
                      value={mfRowsPerPage}
                      onChange={(e) => setMfRowsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value) as RowsPerPage)}
                      className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-purple-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value="all">All ({mfHoldings.length})</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 sticky top-0">
                  <tr>
                    {[
                      { key: 'name', label: 'Fund' },
                      { key: 'quantity', label: 'Units' },
                      { key: 'avgPrice', label: 'Avg NAV' },
                      { key: 'lastPrice', label: 'Current NAV' },
                      { key: 'currentValue', label: 'Value' },
                      { key: 'pnl', label: 'P&L' },
                    ].map(col => (
                      <th 
                        key={col.key} 
                        onClick={() => handleMfSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {mfSortField === col.key && (
                            <span className="text-purple-400">{mfSortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {displayedMFs.map((h, i) => {
                    // Calculate P&L from current value - invested
                    const calculatedPnL = h.currentValue - h.invested
                    const calculatedPnLPercent = h.invested > 0 ? (calculatedPnL / h.invested) * 100 : 0
                    return (
                      <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white max-w-[200px] truncate" title={getMFDisplayName(h)}>
                            {getMFDisplayName(h)}
                          </div>
                          <div className="text-xs text-slate-500">Folio: {h.folio}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{h.quantity.toFixed(3)}</td>
                        <td className="px-4 py-3 text-slate-300">₹{h.avgPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-slate-300">₹{h.lastPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 font-semibold text-white">{formatCurrency(h.currentValue)}</td>
                        <td className={`px-4 py-3 font-semibold ${calculatedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(calculatedPnL)}
                          <div className="text-xs opacity-70">{formatPercent(calculatedPnLPercent)}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Show more indicator */}
            {mfRowsPerPage !== 'all' && mfHoldings.length > mfRowsPerPage && (
              <div className="p-3 text-center border-t border-slate-700/50 bg-slate-800/30">
                <button
                  onClick={() => setMfRowsPerPage('all')}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                >
                  Show all {mfHoldings.length} mutual funds →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top Gainers / Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 rounded-2xl p-5 border border-emerald-500/30 shadow-lg">
          <h3 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
            🚀 Top Gainers
          </h3>
          <div className="space-y-3">
            {allHoldings
              .filter(h => h.calculatedPnLPercent > 0)
              .sort((a, b) => b.calculatedPnLPercent - a.calculatedPnLPercent)
              .slice(0, 5)
              .map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/30 transition-colors">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {h.displayName.slice(0, 20)}{h.displayName.length > 20 ? '...' : ''}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${h.type === 'Stock' ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'}`}>
                        {h.type}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">{formatCurrency(h.currentValue)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">{formatPercent(h.calculatedPnLPercent)}</div>
                    <div className="text-sm text-emerald-400/70">{formatCurrency(h.calculatedPnL)}</div>
                  </div>
                </div>
              ))}
            {allHoldings.filter(h => h.calculatedPnLPercent > 0).length === 0 && (
              <div className="text-slate-500 text-center py-4">No gainers</div>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-gradient-to-br from-red-900/30 to-rose-900/20 rounded-2xl p-5 border border-red-500/30 shadow-lg">
          <h3 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
            📉 Top Losers
          </h3>
          <div className="space-y-3">
            {allHoldings
              .filter(h => h.calculatedPnLPercent < 0)
              .sort((a, b) => a.calculatedPnLPercent - b.calculatedPnLPercent)
              .slice(0, 5)
              .map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/30 transition-colors">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {h.displayName.slice(0, 20)}{h.displayName.length > 20 ? '...' : ''}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${h.type === 'Stock' ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'}`}>
                        {h.type}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">{formatCurrency(h.currentValue)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-400">{formatPercent(h.calculatedPnLPercent)}</div>
                    <div className="text-sm text-red-400/70">{formatCurrency(h.calculatedPnL)}</div>
                  </div>
                </div>
              ))}
            {allHoldings.filter(h => h.calculatedPnLPercent < 0).length === 0 && (
              <div className="text-slate-500 text-center py-4">No losers</div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Insights */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          💡 Investment Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Portfolio Composition */}
          <div className="bg-black/20 rounded-xl p-4">
            <span className="text-slate-400 text-sm">Portfolio Split</span>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-blue-300">Stocks</span>
                <span className="text-white font-semibold">
                  {totalCurrentValue > 0 ? ((stocksSummary?.totalCurrentValue || 0) / totalCurrentValue * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${totalCurrentValue > 0 ? ((stocksSummary?.totalCurrentValue || 0) / totalCurrentValue * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-purple-300">Mutual Funds</span>
                <span className="text-white font-semibold">
                  {totalCurrentValue > 0 ? ((mfSummary?.totalCurrentValue || 0) / totalCurrentValue * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${totalCurrentValue > 0 ? ((mfSummary?.totalCurrentValue || 0) / totalCurrentValue * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Best Performer */}
          {allHoldings.length > 0 && (
            <div className="bg-black/20 rounded-xl p-4">
              <span className="text-slate-400 text-sm">🏆 Best Performer</span>
              <div className="mt-2">
                {(() => {
                  const best = [...allHoldings].sort((a, b) => b.pnlPercent - a.pnlPercent)[0]
                  return best ? (
                    <>
                      <div className="font-semibold text-white">{best.displayName.slice(0, 20)}</div>
                      <div className="text-emerald-400 font-bold text-lg">{formatPercent(best.pnlPercent)}</div>
                      <div className="text-slate-500 text-sm">{formatCurrency(best.pnl)} profit</div>
                    </>
                  ) : null
                })()}
              </div>
            </div>
          )}

          {/* Largest Holding */}
          {allHoldings.length > 0 && (
            <div className="bg-black/20 rounded-xl p-4">
              <span className="text-slate-400 text-sm">💎 Largest Holding</span>
              <div className="mt-2">
                {(() => {
                  const largest = [...allHoldings].sort((a, b) => b.currentValue - a.currentValue)[0]
                  return largest ? (
                    <>
                      <div className="font-semibold text-white">{largest.displayName.slice(0, 20)}</div>
                      <div className="text-blue-400 font-bold text-lg">{formatCurrency(largest.currentValue, true)}</div>
                      <div className="text-slate-500 text-sm">
                        {totalCurrentValue > 0 ? (largest.currentValue / totalCurrentValue * 100).toFixed(1) : 0}% of portfolio
                      </div>
                    </>
                  ) : null
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
