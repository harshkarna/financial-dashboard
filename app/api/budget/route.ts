import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '@/lib/auth'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 300000 // 5 minutes cache to avoid rate limits

interface ExpenseItem {
  month: string
  category: string
  breakdown: string
  amount: number
  year: number
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
  year: number
}

// Helper to extract year from month string like "Oct/25" -> 2025
function extractYear(monthStr: string): number {
  const parts = monthStr.split('/')
  if (parts.length >= 2) {
    const yearPart = parts[1]
    return 2000 + parseInt(yearPart)
  }
  return new Date().getFullYear()
}

// Helper to parse month string to month number
function getMonthNumber(monthStr: string): number {
  const monthMap: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
  }
  const [monthPart] = monthStr.split('/')
  return monthMap[monthPart.toLowerCase()] || 0
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
    const month = searchParams.get('month')
    const year = searchParams.get('year') // New: year filter
    
    // Cache key includes year
    const cacheKey = `budget-${year || 'all'}-${month || 'all'}-v3`
    
    // Check cache (disabled for debugging)
    // const cached = cache.get(cacheKey)
    // if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    //   return NextResponse.json(cached.data)
    // }

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

    // Get all available sheets
    const sheetsInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    })
    
    const availableSheets = sheetsInfo.data.sheets?.map(sheet => sheet.properties?.title) || []
    console.log('Available sheets:', availableSheets)

    // Find all "Monthly Budget YYYY" sheets dynamically
    const budgetSheetPattern = /^Monthly Budget (\d{4})$/
    const budgetSheets = availableSheets
      .filter((name): name is string => name !== null && name !== undefined && budgetSheetPattern.test(name))
      .map(name => {
        const match = name.match(budgetSheetPattern)
        return {
          name,
          year: match ? parseInt(match[1]) : 0
        }
      })
      .sort((a, b) => a.year - b.year) // Sort by year ascending

    console.log('Found budget sheets:', budgetSheets)

    if (budgetSheets.length === 0) {
      return NextResponse.json({
        expenses: [],
        income: [],
        summary: {},
        availableMonths: [],
        availableYears: []
      })
    }

    // Collect all expenses and income from all budget sheets
    const allExpenses: ExpenseItem[] = []
    const allIncome: IncomeItem[] = []
    
    const parseAmount = (value: string | undefined) => {
      if (!value) return 0
      const clean = value.toString().replace(/[₹,\s]/g, '')
      return parseFloat(clean) || 0
    }
    
    // Fetch data from each budget sheet
    for (const budgetSheet of budgetSheets) {
      console.log(`Fetching data from sheet: "${budgetSheet.name}"`)
      
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${budgetSheet.name}'!A:M`,
        })

        const rows = response.data.values || []
        console.log(`Fetched ${rows.length} rows from ${budgetSheet.name}`)

        if (rows.length === 0) continue

        // Skip header row and parse data
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
      if (!row || row.length < 4) continue
      
      // Parse expense data (columns A-D)
      const monthValue = row[0]?.toString().trim()
      const category = row[1]?.toString().trim()
      const breakdown = row[2]?.toString().trim()
      const rawAmount = row[3]?.toString() || '0'
      
      if (monthValue && breakdown) {
        const amount = parseAmount(rawAmount)
            const expenseYear = extractYear(monthValue)
            allExpenses.push({
          month: monthValue,
          category: category || 'Uncategorized',
          breakdown,
              amount,
              year: expenseYear
        })
      }
      
          // Parse income data (columns F-M)
      if (row.length >= 13) {
            const incomeMonth = row[5]?.toString().trim()
            if (incomeMonth && incomeMonth.toLowerCase() !== 'total' && incomeMonth.toLowerCase() !== 'month') {
              const incomeYear = extractYear(incomeMonth)
              const incomeData = {
                month: incomeMonth,
                incomeSource1: parseAmount(row[6]),
                incomeSource2: parseAmount(row[7]),
                otherIncome: parseAmount(row[8]),
                otherTaxDeduction: parseAmount(row[9]),
                totalIncome: parseAmount(row[10]),
                totalExpenses: parseAmount(row[11]),
                totalSavings: parseAmount(row[12]),
                year: incomeYear
              }
              // Debug log for 2026 months
              if (incomeYear === 2026) {
                console.log(`Parsing 2026 income: ${incomeMonth} - src1=${incomeData.incomeSource1}, src2=${incomeData.incomeSource2}, total=${incomeData.totalIncome}`)
              }
              allIncome.push(incomeData)
        }
      }
    }
      } catch (err) {
        console.error(`Error fetching sheet ${budgetSheet.name}:`, err)
      }
    }

    console.log(`Total expenses: ${allExpenses.length}, Total income records: ${allIncome.length}`)

    // Get available years from income data
    const availableYears = Array.from(new Set(allIncome.map(inc => inc.year))).sort((a, b) => b - a)
    console.log('Available years:', availableYears)

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()
    
    let filteredIncome = [...allIncome]
    let filteredExpenses = [...allExpenses]

    // Helper to check if a month is in the future
    const isNotFutureMonth = (itemYear: number, itemMonth: number) => {
      // Past years - always valid
      if (itemYear < currentYear) return true
      // Current year - only if month is current or past
      if (itemYear === currentYear && itemMonth <= currentMonth) return true
      // Future year or future month in current year - skip
      return false
    }

    // Helper to check if a row has actual data (not just empty/zero values)
    const hasActualData = (inc: IncomeItem) => {
      const hasData = inc.totalIncome > 0 || inc.totalExpenses > 0 || inc.incomeSource1 > 0 || inc.incomeSource2 > 0
      if (!hasData) {
        console.log(`Filtering out ${inc.month} - no data (totalIncome: ${inc.totalIncome}, totalExpenses: ${inc.totalExpenses})`)
      }
      return hasData
    }

    // Apply year filter if specified
    if (year && year !== 'all') {
      const yearNum = parseInt(year)
      // Filter to selected year AND only include rows with actual data
      // Show months with actual data even if they're technically in the "future"
      filteredIncome = allIncome.filter(inc => {
        if (inc.year !== yearNum) return false
        // Only include rows with actual data (this handles both past empty months and future empty months)
        return hasActualData(inc)
      })
      filteredExpenses = allExpenses.filter(exp => {
        if (exp.year !== yearNum) return false
        return true
      })
      console.log(`Filtered to year ${year}: ${filteredIncome.length} income, ${filteredExpenses.length} expenses`)
      console.log(`Filtered income months: ${filteredIncome.map(i => `${i.month}: income=${i.totalIncome}`).join(', ')}`)
    } else {
      // For "All Years", filter to past/current months with actual data
      filteredIncome = allIncome.filter(inc => {
        const incMonth = getMonthNumber(inc.month)
        // For all years view, only show past/current months
        if (!isNotFutureMonth(inc.year, incMonth)) return false
        return hasActualData(inc)
      })

      filteredExpenses = allExpenses.filter(exp => {
        const expMonth = getMonthNumber(exp.month)
        return isNotFutureMonth(exp.year, expMonth)
      })
    }
    
    // Apply month filter if specified
    let finalExpenses = filteredExpenses
    let finalIncome = filteredIncome
    let latestIncomeData: IncomeItem | { month: string; incomeSource1: number; incomeSource2: number; otherIncome: number; otherTaxDeduction: number; totalIncome: number; totalExpenses: number; totalSavings: number; year: number }
    
    if (month && month !== 'all') {
      finalExpenses = filteredExpenses.filter(expense => 
        expense.month.toLowerCase().includes(month.toLowerCase())
      )
      const selectedMonthData = filteredIncome.filter(inc => 
        inc.month.toLowerCase().includes(month.toLowerCase())
      )
      if (selectedMonthData.length > 0) {
        latestIncomeData = selectedMonthData[0]
      } else {
        latestIncomeData = filteredIncome[filteredIncome.length - 1] || createEmptyIncomeItem()
      }
    } else {
      // Aggregate all months
      latestIncomeData = {
        month: 'All Months',
        incomeSource1: filteredIncome.reduce((sum, inc) => sum + inc.incomeSource1, 0),
        incomeSource2: filteredIncome.reduce((sum, inc) => sum + inc.incomeSource2, 0),
        otherIncome: filteredIncome.reduce((sum, inc) => sum + inc.otherIncome, 0),
        otherTaxDeduction: filteredIncome.reduce((sum, inc) => sum + inc.otherTaxDeduction, 0),
        totalIncome: filteredIncome.reduce((sum, inc) => sum + inc.totalIncome, 0),
        totalExpenses: filteredIncome.reduce((sum, inc) => sum + inc.totalExpenses, 0),
        totalSavings: filteredIncome.reduce((sum, inc) => sum + inc.totalSavings, 0),
        year: year ? parseInt(year) : currentYear
      }
    }

    // Generate summary - pass allIncome for complete fiscal year tax calculations
    const summary = generateBudgetSummary(finalExpenses, finalIncome, latestIncomeData, filteredIncome, year ? parseInt(year) : null, allIncome)

    // Sort months chronologically
    const sortedMonths = sortMonthsChronologically(Array.from(new Set(filteredIncome.map(e => e.month))))

    const result = {
      expenses: finalExpenses,
      income: finalIncome,
      summary,
      availableMonths: sortedMonths,
      availableYears
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

function createEmptyIncomeItem(): IncomeItem {
  return {
    month: '',
    incomeSource1: 0,
    incomeSource2: 0,
    otherIncome: 0,
    otherTaxDeduction: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    year: new Date().getFullYear()
  }
}

function sortMonthsChronologically(months: string[]): string[] {
  return months.sort((a, b) => {
    const yearA = extractYear(a)
    const yearB = extractYear(b)
    
    if (yearA !== yearB) return yearA - yearB
    
    return getMonthNumber(a) - getMonthNumber(b)
  })
}

function generateBudgetSummary(
  expenses: ExpenseItem[], 
  income: IncomeItem[], 
  latestIncomeData: IncomeItem | { month: string; incomeSource1: number; incomeSource2: number; otherIncome: number; otherTaxDeduction: number; totalIncome: number; totalExpenses: number; totalSavings: number; year: number },
  filteredIncomeForTrends: IncomeItem[],
  selectedYear: number | null,
  allIncomeForTax: IncomeItem[] // All income data from all sheets for fiscal year tax calculation
) {
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
        monthlyBreakdown: [],
        fiscalYear: ''
      }
    }
  }
  
  // Category-wise expense analysis
  const categoryTotals: { [key: string]: number } = {}
  const monthlyExpenses: { [key: string]: number } = {}
  
  expenses.forEach(expense => {
    const category = expense.category || 'Other'
    
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0
    }
    categoryTotals[category] += expense.amount
    
    if (!monthlyExpenses[expense.month]) {
      monthlyExpenses[expense.month] = 0
    }
    monthlyExpenses[expense.month] += expense.amount
  })

  // Top spending categories
  let topCategories = Object.entries(categoryTotals)
    .filter(([category]) => category && category.trim() !== '')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }))
  
  if (topCategories.length === 0 && expenses.length > 0) {
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

  // Calculate tax deductions with fiscal year context - use ALL income to span both sheets
  const taxDeductions = calculateTaxDeductions(allIncomeForTax, selectedYear)

  // Get last 4 months for trends
  const last4Months = filteredIncomeForTrends.slice(-4)
  const monthlyTrends = last4Months.map(inc => ({
    month: inc.month,
    income: inc.totalIncome,
    expenses: inc.totalExpenses,
    savings: inc.totalSavings,
    savingsRate: inc.totalIncome > 0 ? (inc.totalSavings / inc.totalIncome) * 100 : 0
  }))

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

function calculateTaxDeductions(income: IncomeItem[], selectedYear: number | null) {
  // Determine fiscal year (Apr - Mar)
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  // Fiscal year starts in April
  // If selected year is provided, use that; otherwise use current fiscal year
  let fiscalYearStart: number
  let fiscalYearEnd: number
  
  if (selectedYear) {
    fiscalYearStart = selectedYear
    fiscalYearEnd = selectedYear + 1
  } else {
    // Current fiscal year: if we're in Jan-Mar, FY started last year
    fiscalYearStart = currentMonth >= 4 ? currentYear : currentYear - 1
    fiscalYearEnd = fiscalYearStart + 1
  }
  
  const fiscalYearLabel = `FY ${fiscalYearStart}-${fiscalYearEnd.toString().slice(-2)}`
  
  console.log(`Calculating tax for ${fiscalYearLabel}: Apr/${fiscalYearStart.toString().slice(-2)} to Mar/${fiscalYearEnd.toString().slice(-2)}`)
  console.log(`Total income records to search: ${income.length}`)
  
  // Filter income for fiscal year (Apr of start year to Mar of end year)
  const fiscalYearIncome = income.filter(inc => {
    const incYear = inc.year
    const incMonth = getMonthNumber(inc.month)
  
    // Apr-Dec of start year OR Jan-Mar of end year
    const isInFiscalYear = 
      (incYear === fiscalYearStart && incMonth >= 4) ||
      (incYear === fiscalYearEnd && incMonth <= 3)
    
    return isInFiscalYear
  })
  
  console.log(`Found ${fiscalYearIncome.length} months in fiscal year`)
  
  // Sort by fiscal year order: Apr(4), May(5)...Dec(12), Jan(1), Feb(2), Mar(3)
  const sortedFiscalYearIncome = fiscalYearIncome.sort((a, b) => {
    const monthA = getMonthNumber(a.month)
    const monthB = getMonthNumber(b.month)
    const yearA = a.year
    const yearB = b.year
    
    // First sort by year
    if (yearA !== yearB) return yearA - yearB
    
    // Then by month (Apr-Dec comes before Jan-Mar in fiscal year)
    // Convert to fiscal month order: Apr=1, May=2...Dec=9, Jan=10, Feb=11, Mar=12
    const fiscalMonthA = monthA >= 4 ? monthA - 3 : monthA + 9
    const fiscalMonthB = monthB >= 4 ? monthB - 3 : monthB + 9
    
    return fiscalMonthA - fiscalMonthB
  })
  
  // Calculate tax deductions
  const totalTaxDeductions = sortedFiscalYearIncome.reduce((sum, inc) => {
    const taxAmount = inc.otherTaxDeduction !== 0 ? Math.abs(inc.otherTaxDeduction) : 0
    return sum + taxAmount
  }, 0)
  
  const monthlyBreakdown = sortedFiscalYearIncome.map(inc => ({
    month: inc.month,
    amount: inc.otherTaxDeduction !== 0 ? Math.abs(inc.otherTaxDeduction) : 0
  })).filter(item => item.amount > 0)

  console.log(`Tax breakdown months: ${monthlyBreakdown.map(m => m.month).join(', ')}`)

  return {
    total: totalTaxDeductions,
    fromApr: totalTaxDeductions,
    monthlyBreakdown,
    fiscalYear: fiscalYearLabel
  }
}
