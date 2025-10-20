'use client'

interface EarningRecord {
  month: string
  monthName: string
  year: number
  income: number
  expenditure: number
  saving: number
  invest: number
  savingPercent: number
  investPercent: number
}

interface EarningsChartProps {
  data: EarningRecord[]
  selectedYear: number | null
}

export function EarningsChart({ data, selectedYear }: EarningsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="text-center text-gray-500 py-8">No data available for chart</div>
      </div>
    )
  }

  // Sort data by month order (assuming chronological order in data)
  const sortedData = [...data].reverse() // Most recent first in your sheet, so reverse for chronological

  const maxValue = Math.max(
    ...sortedData.map(d => Math.max(d.income, d.expenditure, d.saving, d.invest))
  )

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`
    }
    return `₹${amount}`
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Monthly Trends {selectedYear ? `- ${selectedYear}` : ''}
      </h3>
      
      <div className="space-y-6">
        {sortedData.map((record, index) => {
          const incomeWidth = (record.income / maxValue) * 100
          const expenditureWidth = (record.expenditure / maxValue) * 100
          const savingWidth = (record.saving / maxValue) * 100
          const investWidth = (record.invest / maxValue) * 100

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 w-20">{record.month}</span>
                <div className="flex space-x-4 text-xs text-gray-600">
                  <span className="text-green-600">Income: {formatCurrency(record.income)}</span>
                  <span className="text-red-600">Expense: {formatCurrency(record.expenditure)}</span>
                  <span className="text-blue-600">Saving: {formatCurrency(record.saving)}</span>
                  <span className="text-purple-600">Invest: {formatCurrency(record.invest)}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                {/* Income Bar */}
                <div className="flex items-center">
                  <span className="text-xs text-green-600 w-16">Income</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${incomeWidth}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Expenditure Bar */}
                <div className="flex items-center">
                  <span className="text-xs text-red-600 w-16">Expense</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${expenditureWidth}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Saving Bar */}
                <div className="flex items-center">
                  <span className="text-xs text-blue-600 w-16">Saving</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${savingWidth}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Investment Bar */}
                <div className="flex items-center">
                  <span className="text-xs text-purple-600 w-16">Invest</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${investWidth}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Percentage Info */}
              <div className="flex justify-end space-x-4 text-xs text-gray-500">
                <span>Saving: {record.savingPercent.toFixed(1)}%</span>
                <span>Invest: {record.investPercent.toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}