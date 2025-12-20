'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'

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
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border shadow-sm
      ${isPositive 
        ? 'bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 dark:from-gray-800 dark:via-emerald-900/10 dark:to-teal-900/10 border-emerald-100 dark:border-emerald-900/30' 
        : 'bg-gradient-to-br from-white via-red-50/30 to-rose-50/50 dark:from-gray-800 dark:via-red-900/10 dark:to-rose-900/10 border-red-100 dark:border-red-900/30'
      }
    `}>
      {/* Decorative background */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`} />
      
      <div className="relative p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className={`
              flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl
              ${isPositive 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25' 
                : 'bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/25'
              }
            `}>
              <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPositive ? 'What you own' : 'What you owe'}
              </p>
            </div>
          </div>
          
          <div className={`
            px-3 py-1.5 md:px-4 md:py-2 rounded-xl
            ${isPositive 
              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
            }
          `}>
            <p className={`text-base md:text-lg font-bold ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              <span className="md:hidden">{formatShort(total)}</span>
              <span className="hidden md:inline">{formatCurrency(total)}</span>
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2 md:space-y-3">
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
                className={`
                  rounded-xl overflow-hidden transition-all duration-200
                  bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm
                  border ${isPositive ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-red-100 dark:border-red-900/30'}
                  hover:shadow-md
                `}
              >
                {/* Category Header */}
                <button 
                  className="w-full flex items-center justify-between p-3 md:p-4 transition-colors"
                  onClick={() => toggleCategory(categoryType)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-1 h-6 rounded-full
                      ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}
                    `} />
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {categoryType}
                    </span>
                  </div>
                  <span className={`
                    text-sm font-bold px-2 py-0.5 rounded-lg
                    ${isPositive 
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
                      : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                    }
                  `}>
                    <span className="md:hidden">{formatShort(categoryTotal)}</span>
                    <span className="hidden md:inline">{formatCurrency(categoryTotal)}</span>
                  </span>
                </button>

                {/* Category Details */}
                {!isCollapsed && (
                  <div className="px-4 pb-3 md:px-5 md:pb-4 ml-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="pt-2 space-y-1.5 md:space-y-2">
                      {typeItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
                            {item.item}
                          </span>
                          <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-200">
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
