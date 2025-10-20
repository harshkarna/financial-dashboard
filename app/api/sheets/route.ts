import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 300000 // 5 minutes cache to avoid rate limits

export async function GET(request: NextRequest) {
  try {
    
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    let month = searchParams.get('month')
    
    // Check cache first
    const cacheKey = `sheets-${month || 'latest'}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Returning cached data for ${cacheKey}`)
      // Verify the cached data has the correct month
      if (cached.data.selectedMonth) {
        console.log(`Cached data month: ${cached.data.selectedMonth}`)
        return NextResponse.json(cached.data)
      }
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

    console.log(`Fetching data from Google Sheet: ${spreadsheetId}, tab: "Net Worth"`)

    // Fetch all data from the "Net Worth" sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Net Worth!A:K', // Fetch columns A through K
    })

    const rows = response.data.values || []
    console.log(`Fetched ${rows.length} rows from Google Sheets`)
    console.log('First 5 rows:', rows.slice(0, 5))

    if (rows.length === 0) {
      return NextResponse.json({
        netWorth: 0,
        assets: [],
        liabilities: []
      })
    }

    // Find the header row and month column
    const headerRowIndex = rows.findIndex(row => 
      row.some(cell => cell && cell.toLowerCase().includes('category'))
    )

    if (headerRowIndex === -1) {
      throw new Error('Header row not found')
    }

    const headerRow = rows[headerRowIndex]
    console.log('Header row:', headerRow)

    // Extract available month columns (skip first 3 columns: Category, Type, Item)
    const availableMonths = headerRow.slice(3).filter(header => 
      header && header.toString().trim() && header.toString().trim() !== '#'
    )
    
    console.log('Available months in sheet:', availableMonths)

    let monthColumnIndex = -1
    let selectedMonth = ''

    // Map month names to column headers in your Google Sheet  
    const monthMapping: { [key: string]: string } = {
      'Apr 2025': 'Apr-25',
      'May 2025': 'May-25', 
      'Jun 2025': 'Jun-25',
      'Jul 2025': 'July-25',  // Your sheet shows "July-25"
      'Aug 2025': 'Aug-25',
      'Sep 2025': 'Sep-25',
      'Oct 2025': 'Oct-25',
      'Nov 2025': 'Nov-25',
      'Dec 2025': 'Dec-25'
    }

    if (!month) {
      // No month specified - use the LATEST month (rightmost column)
      monthColumnIndex = headerRow.length - 1
      selectedMonth = headerRow[monthColumnIndex]
      console.log(`No month specified, using latest month: "${selectedMonth}" at column ${monthColumnIndex}`)
    } else {
      const targetMonth = monthMapping[month] || month
      console.log(`Looking for month: "${month}" -> "${targetMonth}"`)

      // Find the column for the requested month
      monthColumnIndex = headerRow.findIndex(header => 
        header && header.toString().trim() === targetMonth
      )

      if (monthColumnIndex !== -1) {
        selectedMonth = targetMonth
        console.log(`Found requested month "${targetMonth}" at column ${monthColumnIndex}`)
      } else {
        console.log(`Month "${targetMonth}" not found, using latest month instead`)
        // Fallback to latest month
        monthColumnIndex = headerRow.length - 1
        selectedMonth = headerRow[monthColumnIndex]
        console.log(`Using latest month: "${selectedMonth}" at column ${monthColumnIndex}`)
      }
    }

    console.log(`Using month "${selectedMonth}" at column index ${monthColumnIndex}`)

    // Parse data rows
    const dataRows = rows.slice(headerRowIndex + 1)
    const assets: any[] = []
    const liabilities: any[] = []
    let netWorthValue = 0

    for (const row of dataRows) {
      const category = row[0]?.toString().trim() // Column A: Category
      const type = row[1]?.toString().trim() // Column B: Type  
      const item = row[2]?.toString().trim() // Column C: Item
      const rawValue = row[monthColumnIndex]?.toString() || '0'
      
      // Clean the amount string - remove ₹, commas, and parse
      const cleanAmount = rawValue.replace(/[₹,\s]/g, '')
      const value = parseFloat(cleanAmount) || 0

      if (!category) continue

      console.log(`Processing: ${category} | ${type} | ${item} | ${rawValue} -> ${value}`)

      if (category.toLowerCase() === 'net worth') {
        netWorthValue = value
      } else if (category.toLowerCase() === 'assets') {
        assets.push({
          category: category,
          type: type || 'Unknown',
          item: item || 'Unknown',
          amount: value
        })
      } else if (category.toLowerCase() === 'liabilities') {
        liabilities.push({
          category: category,
          type: type || 'Unknown', 
          item: item || 'Unknown',
          amount: value
        })
      }
    }

    console.log('Parsed data:', {
      netWorth: netWorthValue,
      assetsCount: assets.length,
      liabilitiesCount: liabilities.length
    })

    // Debug: Check if any liabilities are accidentally in assets
    const assetsWithLiabilities = assets.filter(asset => 
      asset.category?.toLowerCase().includes('liabilities') || 
      asset.category?.toLowerCase().includes('outstanding') ||
      asset.item?.toLowerCase().includes('outstanding') ||
      asset.item?.toLowerCase().includes('tax')
    )
    if (assetsWithLiabilities.length > 0) {
      console.log('WARNING: Found liabilities in assets array:', assetsWithLiabilities)
    }

    // Debug: Calculate actual assets total and identify large items
    const assetsTotal = assets.reduce((sum, asset) => sum + asset.amount, 0)
    const liabilitiesTotal = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
    
    // Log large asset items that might need exclusion
    const largeAssetItems = assets.filter(asset => asset.amount > 100000).sort((a, b) => b.amount - a.amount)
    console.log('Large asset items (>1L):', largeAssetItems.map(item => `${item.item}: ${item.amount}`))
    
    console.log('Assets total:', assetsTotal, 'Liabilities total:', liabilitiesTotal, 'Net Worth:', netWorthValue)
    
    // Calculate what the frontend will show after exclusions
    const excludedItems = ['Invested Mutual Funds', 'Invested Stock']
    const excludedTotal = assets.reduce((sum, asset) => {
      return excludedItems.includes(asset.item) ? sum + asset.amount : sum
    }, 0)
    const frontendAssetsTotal = assetsTotal - excludedTotal
    
    console.log('Excluded items total:', excludedTotal)
    console.log('Frontend Assets total (after exclusions):', frontendAssetsTotal)
    console.log('Expected equation: Frontend Assets - Liabilities = Net Worth')
    console.log('Actual calculation:', frontendAssetsTotal, '-', liabilitiesTotal, '=', frontendAssetsTotal - liabilitiesTotal)
    console.log('Match with Net Worth:', (frontendAssetsTotal - liabilitiesTotal) === netWorthValue ? '✓' : '✗')

    const result = {
      netWorth: netWorthValue,
      assets,
      liabilities,
      selectedMonth
    }

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching sheet data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sheet data' },
      { status: 500 }
    )
  }
}