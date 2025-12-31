'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'

interface AssetItem {
  category: string
  type: string
  item: string
  amount: number
}

interface AssetBreakdownProps {
  title: string
  items: AssetItem[]
  type: 'positive' | 'negative'
}

export function AssetBreakdown({ title, items, type }: AssetBreakdownProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const excludedItems = [
    'Invested Mutual Funds',
    'Invested Stock'
  ]

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }))
  }
  
  const total = items.reduce((sum, item) => {
    if (title === 'Assets' && excludedItems.includes(item.item)) {
      return sum
    }
    return sum + item.amount
  }, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatShort = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, AssetItem[]>)

  const isPositive = type === 'positive'
  const Icon = isPositive ? Wallet : CreditCard

  return (
    <div className={`
      glass-dark rounded-2xl overflow-hidden
      ${isPositive ? 'glow-green' : 'glow-red'}
    `}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`
              w-11 h-11 rounded-xl flex items-center justify-center shadow-lg
              ${isPositive 
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30' 
                : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
              }
            `}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="text-xs text-slate-400">
                {isPositive ? 'What you own' : 'What you owe'}
              </p>
            </div>
          </div>
          
          <div className={`
            px-4 py-2 rounded-xl
            ${isPositive 
              ? 'bg-emerald-500/20 border border-emerald-500/30' 
              : 'bg-red-500/20 border border-red-500/30'
            }
          `}>
            <p className={`text-lg font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className="md:hidden">{formatShort(total)}</span>
              <span className="hidden md:inline">{formatCurrency(total)}</span>
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {Object.entries(groupedItems).map(([categoryType, typeItems]) => {
            const isCollapsed = collapsedCategories[categoryType] ?? true
            const categoryTotal = typeItems.reduce((sum, item) => {
              if (title === 'Assets' && excludedItems.includes(item.item)) {
                return sum
              }
              return sum + item.amount
            }, 0)

            return (
              <div 
                key={categoryType} 
                className="bg-slate-700/30 rounded-xl overflow-hidden border border-slate-600/30 hover:border-slate-500/50 transition-all"
              >
                {/* Category Header */}
                <button 
                  className="w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-700/30"
                  onClick={() => toggleCategory(categoryType)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-1 h-6 rounded-full
                      ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}
                    `} />
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm font-semibold text-white">
                      {categoryType}
                    </span>
                  </div>
                  <span className={`
                    text-sm font-bold px-2.5 py-1 rounded-lg
                    ${isPositive 
                      ? 'text-emerald-400 bg-emerald-500/20' 
                      : 'text-red-400 bg-red-500/20'
                    }
                  `}>
                    <span className="md:hidden">{formatShort(categoryTotal)}</span>
                    <span className="hidden md:inline">{formatCurrency(categoryTotal)}</span>
                  </span>
                </button>

                {/* Category Details */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 ml-8 border-t border-slate-700/50">
                    <div className="pt-3 space-y-2">
                      {typeItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-600/20 transition-colors"
                        >
                          <span className="text-sm text-slate-300 truncate max-w-[60%]">
                            {item.item}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            <span className="md:hidden">{formatShort(item.amount)}</span>
                            <span className="hidden md:inline">{formatCurrency(item.amount)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
