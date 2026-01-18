import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '@/lib/auth'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 300000 // 5 minutes cache

// Exclude these items from total assets (they are cost basis, not market value)
// Market value is tracked separately in "Market Mutual Funds" and "Market Value Stocks"
const EXCLUDED_ITEMS = ['Invested Mutual Funds', 'Invested Stock']

interface AssetData {
  category: string
  type: string
  item: string
  amount: number
}

interface MonthData {
  month: string
  netWorth: number
  assets: AssetData[]
  liabilities: AssetData[]
  totalAssets: number
  totalLiabilities: number
  assetsByType: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cached = cache.get('comparison')
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached comparison data')
      return NextResponse.json(cached.data)
    }

    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set up Google Sheets API
    const auth = new google.auth.OAuth2()
    auth.setCredentials({
      access_token: session.accessToken
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set')
    }

    // Fetch all data from the "Net Worth" sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Net Worth!A:Z',
    })

    const rows = response.data.values || []
    
    if (rows.length === 0) {
      return NextResponse.json({ months: [] })
    }

    // Find the header row
    const headerRowIndex = rows.findIndex(row => 
      row.some(cell => cell && cell.toLowerCase().includes('category'))
    )

    if (headerRowIndex === -1) {
      return NextResponse.json({ months: [] })
    }

    const headerRow = rows[headerRowIndex]
    
    // Get all month columns (starting from column D, index 3)
    const monthColumns: { index: number; name: string }[] = []
    for (let i = 3; i < headerRow.length; i++) {
      const header = headerRow[i]?.toString().trim()
      if (header && header.includes('-')) {
        // Convert "Dec-25" to "Dec 2025"
        const [monthName, year] = header.split('-')
        const fullYear = year.length === 2 ? `20${year}` : year
        const displayName = monthName === 'July' ? `Jul ${fullYear}` : `${monthName} ${fullYear}`
        monthColumns.push({ index: i, name: displayName })
      }
    }

    // Parse data for each month
    const dataRows = rows.slice(headerRowIndex + 1)
    const monthsData: MonthData[] = []

    for (const monthCol of monthColumns) {
      const assets: AssetData[] = []
      const liabilities: AssetData[] = []
      let netWorthValue = 0
      const assetsByType: Record<string, number> = {}

      for (const row of dataRows) {
        const category = row[0]?.toString().trim()
        const type = row[1]?.toString().trim()
        const item = row[2]?.toString().trim()
        const rawValue = row[monthCol.index]?.toString() || '0'
        
        const cleanAmount = rawValue.replace(/[₹,\s]/g, '')
        const value = parseFloat(cleanAmount) || 0

        if (!category) continue

        if (category.toLowerCase() === 'net worth') {
          netWorthValue = value
        } else if (category.toLowerCase() === 'assets') {
          // Skip excluded items (cost basis - we use market value instead)
          const isExcluded = EXCLUDED_ITEMS.includes(item)
          
          if (!isExcluded) {
            assets.push({ category, type: type || 'Unknown', item: item || 'Unknown', amount: value })
            
            // Group by type (only non-excluded items)
            const typeKey = type || 'Other'
            assetsByType[typeKey] = (assetsByType[typeKey] || 0) + value
          }
        } else if (category.toLowerCase() === 'liabilities') {
          liabilities.push({ category, type: type || 'Unknown', item: item || 'Unknown', amount: value })
        }
      }

      const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0)
      const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0)

      monthsData.push({
        month: monthCol.name,
        netWorth: netWorthValue,
        assets,
        liabilities,
        totalAssets,
        totalLiabilities,
        assetsByType
      })
    }

    // Sort by date (most recent first)
    monthsData.sort((a, b) => {
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateB.getTime() - dateA.getTime()
    })

    // Calculate comparisons
    const comparisons = calculateComparisons(monthsData)

    const result = {
      months: monthsData,
      comparisons
    }

    // Cache the result
    cache.set('comparison', { data: result, timestamp: Date.now() })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching comparison data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    )
  }
}

function calculateComparisons(monthsData: MonthData[]) {
  if (monthsData.length < 2) {
    return {
      mom: null,  // Month over month
      twoMonth: null,
      threeMonth: null,
      sixMonth: null
    }
  }

  const current = monthsData[0]
  const lastMonth = monthsData[1]
  const twoMonthsAgo = monthsData[2]
  const threeMonthsAgo = monthsData[3]
  const sixMonthsAgo = monthsData[5]

  return {
    mom: calculatePeriodComparison(current, lastMonth, '1 Month'),
    twoMonth: twoMonthsAgo ? calculatePeriodComparison(current, twoMonthsAgo, '2 Months') : null,
    threeMonth: threeMonthsAgo ? calculatePeriodComparison(current, threeMonthsAgo, '3 Months') : null,
    sixMonth: sixMonthsAgo ? calculatePeriodComparison(current, sixMonthsAgo, '6 Months') : null
  }
}

function calculatePeriodComparison(current: MonthData, previous: MonthData, period: string) {
  const netWorthChange = current.netWorth - previous.netWorth
  const netWorthPercent = previous.netWorth !== 0 
    ? ((netWorthChange / previous.netWorth) * 100) 
    : 0

  const assetsChange = current.totalAssets - previous.totalAssets
  const assetsPercent = previous.totalAssets !== 0 
    ? ((assetsChange / previous.totalAssets) * 100) 
    : 0

  const liabilitiesChange = current.totalLiabilities - previous.totalLiabilities
  const liabilitiesPercent = previous.totalLiabilities !== 0 
    ? ((liabilitiesChange / previous.totalLiabilities) * 100) 
    : 0

  // Calculate changes by asset type
  const typeChanges: Record<string, { current: number; previous: number; change: number; percent: number }> = {}
  
  // Combine all types from both periods
  const allTypes = new Set([
    ...Object.keys(current.assetsByType),
    ...Object.keys(previous.assetsByType)
  ])

  for (const type of allTypes) {
    const currentVal = current.assetsByType[type] || 0
    const previousVal = previous.assetsByType[type] || 0
    const change = currentVal - previousVal
    const percent = previousVal !== 0 ? ((change / previousVal) * 100) : (currentVal > 0 ? 100 : 0)
    
    typeChanges[type] = {
      current: currentVal,
      previous: previousVal,
      change,
      percent
    }
  }

  // Find top gainers and losers by item
  const itemChanges: { item: string; type: string; change: number; percent: number; current: number }[] = []
  
  // Map current assets by item
  const currentItemsMap = new Map(current.assets.map(a => [a.item, a]))
  const previousItemsMap = new Map(previous.assets.map(a => [a.item, a]))

  // All unique items
  const allItems = new Set([
    ...current.assets.map(a => a.item),
    ...previous.assets.map(a => a.item)
  ])

  for (const itemName of allItems) {
    const currentItem = currentItemsMap.get(itemName)
    const previousItem = previousItemsMap.get(itemName)
    
    const currentVal = currentItem?.amount || 0
    const previousVal = previousItem?.amount || 0
    const change = currentVal - previousVal
    
    if (change !== 0) {
      const percent = previousVal !== 0 ? ((change / previousVal) * 100) : (currentVal > 0 ? 100 : 0)
      itemChanges.push({
        item: itemName,
        type: currentItem?.type || previousItem?.type || 'Unknown',
        change,
        percent,
        current: currentVal
      })
    }
  }

  // Sort by absolute change
  itemChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  return {
    period,
    fromMonth: previous.month,
    toMonth: current.month,
    netWorth: {
      current: current.netWorth,
      previous: previous.netWorth,
      change: netWorthChange,
      percent: netWorthPercent
    },
    assets: {
      current: current.totalAssets,
      previous: previous.totalAssets,
      change: assetsChange,
      percent: assetsPercent
    },
    liabilities: {
      current: current.totalLiabilities,
      previous: previous.totalLiabilities,
      change: liabilitiesChange,
      percent: liabilitiesPercent
    },
    byType: typeChanges,
    topChanges: itemChanges.slice(0, 5),  // Top 5 biggest changes
    topGainers: itemChanges.filter(i => i.change > 0).slice(0, 3),
    topLosers: itemChanges.filter(i => i.change < 0).slice(0, 3)
  }
}
