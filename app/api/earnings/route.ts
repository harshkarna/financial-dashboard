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
    const year = searchParams.get('year')

    // Check cache first
    const cacheKey = `earnings-${year || 'all'}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached earnings data for year:', year || 'all')
      return NextResponse.json(cached.data)
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured' },
        { status: 500 }
      )
    }

    console.log('Fetching earnings data from Google Sheet:', spreadsheetId, 'tab: "Earning Breakdown"')

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    
    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Earning Breakdown!A:H',
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      console.log('No earnings data found')
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    console.log(`Fetched ${rows.length} rows from Earnings Breakdown sheet`)
    console.log('First 3 rows:', rows.slice(0, 3))

    // Parse the data
    const headerRow = rows[0]
    const dataRows = rows.slice(1)

    // Expected columns: Month, Income, Expenditure, Saving, Invest, %, % Invest
    const earnings = dataRows
      .filter(row => row[0] && row[0].trim() !== '') // Filter out empty rows
      .map(row => {
        const month = row[0]?.toString().trim()
        const income = parseFloat(row[1]?.toString().replace(/[₹,]/g, '') || '0')
        const expenditure = parseFloat(row[2]?.toString().replace(/[₹,]/g, '') || '0')
        const saving = parseFloat(row[3]?.toString().replace(/[₹,]/g, '') || '0')
        const invest = parseFloat(row[4]?.toString().replace(/[₹,]/g, '') || '0')
        // Note: Column F (index 5) contains the actual investment percentage
        // Column G (index 6) seems to be redundant 
        const savingPercent = saving > 0 && income > 0 ? (saving / income) * 100 : 0 // Calculate saving % 
        const investPercent = parseFloat(row[5]?.toString().replace(/[%,]/g, '') || '0') // This is the actual investment %

        // Extract year and month from the month string (e.g., "Aug/21" -> year: 2021, month: "Aug")
        const [monthName, yearStr] = month.split('/')
        const fullYear = yearStr ? (yearStr.length === 2 ? `20${yearStr}` : yearStr) : '2021'

        return {
          month,
          monthName,
          year: parseInt(fullYear),
          income,
          expenditure,
          saving,
          invest,
          savingPercent,
          investPercent
        }
      })

    console.log(`Parsed ${earnings.length} earnings records`)

    // Filter by year if specified
    let filteredEarnings = earnings
    if (year) {
      filteredEarnings = earnings.filter(item => item.year === parseInt(year))
      console.log(`Filtered to ${filteredEarnings.length} records for year ${year}`)
    }

    // Get available years
    const availableYears = Array.from(new Set(earnings.map(item => item.year))).sort((a, b) => b - a)

    const result = {
      earnings: filteredEarnings,
      availableYears,
      totalRecords: filteredEarnings.length
    }

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching earnings data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}