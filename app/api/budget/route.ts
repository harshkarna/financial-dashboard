import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 300000 // 5 minutes cache to avoid rate limits

interface ExpenseItem {
  month: string
  category: string
  breakdown: string
  amount: number
}

interface IncomeItem {
  month: string
  incomeSource1: number
  incomeSource2: number
  otherIncome: number
  otherTaxDeduction: number
  totalIncome: number
  totalExpenses: number
  totalSavings: number
}

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
    
    // Clear cache and get fresh data for debugging
    const cacheKey = `budget-${month || 'all'}-v2` // Changed cache key to force refresh
    cache.clear() // Clear all cache for debugging - force fresh data

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

    console.log(`Fetching budget data from Google Sheet: ${spreadsheetId}`)

    // First, let's try to get sheet metadata to see available sheets
    const sheetsInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    })
    
    const availableSheets = sheetsInfo.data.sheets?.map(sheet => sheet.properties?.title) || []
    console.log('Available sheets:', availableSheets)

    // Use the exact sheet name "Monthly Budget 2025" as specified by user
    let budgetSheetName = 'Monthly Budget 2025'
    let incomeSheetName = 'Earning Breakdown'
    
    console.log(`Using budget sheet: "${budgetSheetName}", income sheet: "${incomeSheetName}"`)
    
    // Fetch all data from Monthly Budget 2025 sheet (contains both expense and income data)
    const allDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${budgetSheetName}!A:M`, // Get all columns A through M from Monthly Budget 2025
    })

    const allRows = allDataResponse.data.values || []

    console.log(`Fetched ${allRows.length} rows from Monthly Budget 2025`)
    console.log('First 3 rows (all columns A-M):', allRows.slice(0, 3))
    console.log('Header row structure:', allRows[0])

    if (allRows.length === 0) {
      return NextResponse.json({
        expenses: [],
        income: [],
        summary: {}
      })
    }

    // Parse both expense and income data from Monthly Budget 2025 sheet
    const expenses: ExpenseItem[] = []
    const income: IncomeItem[] = []
    
    const parseAmount = (value: string | undefined) => {
      if (!value) return 0
      const clean = value.toString().replace(/[₹,\s]/g, '')
      return parseFloat(clean) || 0
    }
    
    // Skip header row and parse all data
    for (let i = 1; i < allRows.length; i++) {
      const row = allRows[i]
      if (!row || row.length < 4) continue
      
      // Parse expense data (columns A-D)
      const monthValue = row[0]?.toString().trim()
      const category = row[1]?.toString().trim()
      const breakdown = row[2]?.toString().trim()
      const rawAmount = row[3]?.toString() || '0'
      
      if (monthValue && breakdown) {
        const amount = parseAmount(rawAmount)
        expenses.push({
          month: monthValue,
          category: category || 'Uncategorized',
          breakdown,
          amount
        })
      }
      
      // Parse income data (columns F-M) - check if row has income data
      if (row.length >= 13) {
        const incomeMonth = row[5]?.toString().trim() // Column F
        if (incomeMonth && incomeMonth.toLowerCase() !== 'total') { // Skip "Total" row
          const rawTaxDeduction = row[9]?.toString() || '0' // Column J
          const taxDeduction = parseAmount(rawTaxDeduction)
          
          income.push({
            month: incomeMonth,                         // Column F
            incomeSource1: parseAmount(row[6]),         // Column G
            incomeSource2: parseAmount(row[7]),         // Column H
            otherIncome: parseAmount(row[8]),           // Column I
            otherTaxDeduction: taxDeduction,            // Column J
            totalIncome: parseAmount(row[10]),          // Column K
            totalExpenses: parseAmount(row[11]),        // Column L
            totalSavings: parseAmount(row[12])          // Column M
          })
        }
      }
    }

    // Filter out future months (include current month since we want up-to-date data)
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // 1-12
    const currentYear = currentDate.getFullYear()
    
    const filteredIncome = income.filter(inc => {
      // Extract month and year from format like "Oct/25"
      const [monthStr, yearStr] = inc.month.split('/')
      const year = 2000 + parseInt(yearStr) // Convert "25" to 2025
      
      const monthMap: { [key: string]: number } = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      }
      const month = monthMap[monthStr.toLowerCase()]
      
      // Include current month and all past months (up to current month)
      return year < currentYear || (year === currentYear && month <= currentMonth)
    })
    
    // Filter by month if specified
    let finalExpenses = expenses
    let finalIncome = filteredIncome // Use filtered income (no future months)
    let latestIncomeData
    
    if (month && month !== 'all') {
      finalExpenses = expenses.filter(expense => 
        expense.month.toLowerCase().includes(month.toLowerCase())
      )
      // For specific month selection, use that month's data
      const selectedMonthData = filteredIncome.filter(inc => 
        inc.month.toLowerCase().includes(month.toLowerCase())
      )
      // For summary cards, use selected month data
      if (selectedMonthData.length > 0) {
        latestIncomeData = selectedMonthData[0]
      } else {
        latestIncomeData = filteredIncome[filteredIncome.length - 1] || filteredIncome[0]
      }
    } else {
      // For "All Months", aggregate data from ALL filtered months (Jan to current)
      latestIncomeData = {
        month: 'All Months',
        incomeSource1: filteredIncome.reduce((sum, inc) => sum + inc.incomeSource1, 0),
        incomeSource2: filteredIncome.reduce((sum, inc) => sum + inc.incomeSource2, 0),
        otherIncome: filteredIncome.reduce((sum, inc) => sum + inc.otherIncome, 0),
        otherTaxDeduction: filteredIncome.reduce((sum, inc) => sum + inc.otherTaxDeduction, 0),
        totalIncome: filteredIncome.reduce((sum, inc) => sum + inc.totalIncome, 0),
        totalExpenses: filteredIncome.reduce((sum, inc) => sum + inc.totalExpenses, 0),
        totalSavings: filteredIncome.reduce((sum, inc) => sum + inc.totalSavings, 0)
      }
    }

    // Generate insights and summary with context
    const summary = generateBudgetSummary(finalExpenses, finalIncome, latestIncomeData, filteredIncome)

    // Sort months chronologically
    const sortMonthsChronologically = (months: string[]) => {
      const monthOrder: { [key: string]: number } = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      }
      
      return months.sort((a, b) => {
        const [monthA, yearA] = a.split('/')
        const [monthB, yearB] = b.split('/')
        
        const yearDiff = parseInt(yearA) - parseInt(yearB)
        if (yearDiff !== 0) return yearDiff
        
        const monthOrderA = monthOrder[monthA.toLowerCase()] || 0
        const monthOrderB = monthOrder[monthB.toLowerCase()] || 0
        
        return monthOrderA - monthOrderB
      })
    }

    const result = {
      expenses: finalExpenses,
      income: finalIncome,
      summary,
      availableMonths: sortMonthsChronologically(Array.from(new Set(filteredIncome.map(e => e.month))))
    }

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching budget data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget data' },
      { status: 500 }
    )
  }
}

function generateBudgetSummary(expenses: ExpenseItem[], income: IncomeItem[], latestIncomeData: IncomeItem, filteredIncomeForTrends: IncomeItem[]) {
  if (income.length === 0) {
    return {
      topCategories: [],
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      savingsRate: 0,
      monthlyTrends: [],
      categoryTotals: {},
      monthlyExpenses: {},
      taxDeductions: {
        total: 0,
        fromApr: 0,
        monthlyBreakdown: []
      }
    }
  }
  
  // Category-wise expense analysis from expense breakdown data
  const categoryTotals: { [key: string]: number } = {}
  const monthlyExpenses: { [key: string]: number } = {}
  
  expenses.forEach(expense => {
    const category = expense.category || 'Other'
    
    // Category totals
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0
    }
    categoryTotals[category] += expense.amount
    
    // Monthly totals
    if (!monthlyExpenses[expense.month]) {
      monthlyExpenses[expense.month] = 0
    }
    monthlyExpenses[expense.month] += expense.amount
  })

  // Create top spending categories from actual expense data
  let topCategories = Object.entries(categoryTotals)
    .filter(([category]) => category && category.trim() !== '')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }))
  
  // If no expense categories, create insights from expense breakdown data
  if (topCategories.length === 0 && expenses.length > 0) {
    // Group by breakdown items when categories are missing
    const breakdownTotals: { [key: string]: number } = {}
    expenses.forEach(expense => {
      const breakdown = expense.breakdown || 'Other'
      if (!breakdownTotals[breakdown]) {
        breakdownTotals[breakdown] = 0
      }
      breakdownTotals[breakdown] += expense.amount
    })
    
    topCategories = Object.entries(breakdownTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([breakdown, amount]) => ({ category: breakdown, amount }))
  }

  // Calculate tax deductions using filtered income (no future months)
  const taxDeductions = calculateTaxDeductions(filteredIncomeForTrends)

  // Get last 4 months for trends (always show last 4 months regardless of selection)
  // Use the filtered income data (no future months) and always get last 4
  const last4Months = filteredIncomeForTrends.slice(-4)
  const monthlyTrends = last4Months.map(inc => ({
    month: inc.month,
    income: inc.totalIncome,
    expenses: inc.totalExpenses,
    savings: inc.totalSavings,
    savingsRate: inc.totalIncome > 0 ? (inc.totalSavings / inc.totalIncome) * 100 : 0
  }))

  // Use latest month data for summary cards
  const savingsRate = latestIncomeData.totalIncome > 0 
    ? (latestIncomeData.totalSavings / latestIncomeData.totalIncome) * 100 
    : 0

  return {
    topCategories,
    totalIncome: latestIncomeData.totalIncome,
    totalExpenses: latestIncomeData.totalExpenses,
    totalSavings: latestIncomeData.totalSavings,
    savingsRate: Math.round(savingsRate),
    monthlyTrends,
    categoryTotals,
    monthlyExpenses,
    taxDeductions
  }
}

function calculateTaxDeductions(income: IncomeItem[]) {
  // Find April (starting month) index
  const aprIndex = income.findIndex(inc => inc.month.toLowerCase().includes('apr'))
  const startIndex = aprIndex >= 0 ? aprIndex : 0
  
  // Calculate from April to latest month
  const relevantMonths = income.slice(startIndex)
  
  // All values in the sheet are negative, so we convert them to positive amounts
  const totalTaxDeductions = relevantMonths.reduce((sum, inc) => {
    // All tax deduction values are negative, convert to positive
    const taxAmount = inc.otherTaxDeduction !== 0 ? Math.abs(inc.otherTaxDeduction) : 0
    return sum + taxAmount
  }, 0)
  
  const monthlyBreakdown = relevantMonths.map(inc => ({
    month: inc.month,
    amount: inc.otherTaxDeduction !== 0 ? Math.abs(inc.otherTaxDeduction) : 0
  })).filter(item => item.amount > 0)

  return {
    total: totalTaxDeductions,
    fromApr: totalTaxDeductions,
    monthlyBreakdown
  }
}