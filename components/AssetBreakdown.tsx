'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  // State to track which categories are collapsed (default to collapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  // Exclude "Invested" amounts from total calculation for Assets
  // These represent original investment amounts, not current market values
  // We only want to count the "Market" values to avoid double-counting
  const excludedItems = [
    'Invested Mutual Funds', // Use Market Mutual Funds instead
    'Invested Stock'         // Use Market Value Stocks instead
  ]

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }))
  }
  
  const total = items.reduce((sum, item) => {
    // For Assets, exclude certain investment items from total
    if (title === 'Assets' && excludedItems.includes(item.item)) {
      return sum
    }
    return sum + item.amount
  }, 0)
  
  const colorClass = type === 'positive' ? 'text-green-600' : 'text-red-600'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, AssetItem[]>)

  const gradientClass = type === 'positive' ? 'from-white to-green-50 dark:from-gray-800 dark:to-gray-700' : 'from-white to-red-50 dark:from-gray-800 dark:to-gray-700'
  const borderClass = type === 'positive' ? 'border-green-100 dark:border-gray-600' : 'border-red-100 dark:border-gray-600'
  const accentColor = type === 'positive' ? 'green' : 'red'

  return (
    <div className={`bg-gradient-to-br ${gradientClass} rounded-xl shadow-lg p-6 border ${borderClass} transition-colors duration-200`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {title === 'Assets' ? 'What you own' : 'What you owe'}
          </p>
        </div>
        <div className={`${type === 'positive' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} px-4 py-2 rounded-full`}>
          <p className={`text-lg font-bold ${type === 'positive' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedItems).map(([categoryType, typeItems]) => {
          const isCollapsed = collapsedCategories[categoryType] ?? true // Default to collapsed
          const categoryTotal = typeItems.reduce((sum, item) => {
            // For Assets, exclude certain investment items from subtype totals too
            if (title === 'Assets' && excludedItems.includes(item.item)) {
              return sum
            }
            return sum + item.amount
          }, 0)

          return (
            <div key={categoryType} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 overflow-hidden transition-all duration-200">
              <div className={`border-l-4 ${accentColor === 'green' ? 'border-green-400 dark:border-green-500' : 'border-red-400 dark:border-red-500'}`}>
                {/* Category Header - Always Visible */}
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150"
                  onClick={() => toggleCategory(categoryType)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      )}
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{categoryType}</h3>
                    </div>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${accentColor === 'green' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'}`}>
                    {formatCurrency(categoryTotal)}
                  </span>
                </div>

                {/* Category Details - Collapsible */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 pl-8">
                    <div className="space-y-2">
                      {typeItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.item}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}