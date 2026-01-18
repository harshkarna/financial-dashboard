import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '@/lib/auth'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute cache for months

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cached = cache.get('months')
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached months data')
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

    // Fetch header row from the "Net Worth" sheet to get available months
    // Extended to column Z to accommodate future months
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Net Worth!A1:Z5', // Get first few rows to find header (extended for more months)
    })

    const rows = response.data.values || []
    
    // Find the header row
    const headerRowIndex = rows.findIndex(row => 
      row.some(cell => cell && cell.toLowerCase().includes('category'))
    )

    if (headerRowIndex === -1) {
      return NextResponse.json({ months: [] })
    }

    const headerRow = rows[headerRowIndex]
    
    // Extract month columns (skip first 3 columns: Category, Type, Item)
    const monthColumns = headerRow.slice(3).filter(header => {
      const trimmed = header?.toString().trim()
      return trimmed && trimmed !== '#' && trimmed.includes('-')
    })
    
    // Convert month headers to display format
    const months = monthColumns.map(month => {
      const trimmed = month.toString().trim()
      // Convert "Apr-25" to "Apr 2025", etc.
      if (trimmed.includes('-')) {
        const [monthName, year] = trimmed.split('-')
        const fullYear = year.length === 2 ? `20${year}` : year
        
        // Handle "July-25" case specifically
        if (monthName === 'July') {
          return `Jul ${fullYear}`
        }
        
        return `${monthName} ${fullYear}`
      }
      return trimmed
    })
    
    // Sort months chronologically (most recent first)
    const sortedMonths = months.sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateB.getTime() - dateA.getTime()
    })
    
    const result = { months: sortedMonths }
    
    // Cache the result
    cache.set('months', { data: result, timestamp: Date.now() })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching months:', error)
    return NextResponse.json(
      { error: 'Failed to fetch months' },
      { status: 500 }
    )
  }
}