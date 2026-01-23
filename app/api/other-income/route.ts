import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '@/lib/auth'

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 300000 // 5 minutes cache

interface IncomeEntry {
  description: string
  status: 'Paid' | 'To be Paid' | string
  fy: string
  invoiceDate: string
  totalUSD: number
  estimate: number
  actual: number
  rateConversion: number
  category: 'course' | 'royalty' | 'miscellaneous'
}

// Helper to parse date from various formats (M/D/YYYY or MM/DD/YYYY)
function parseInvoiceDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  const parts = dateStr.split('/')
  if (parts.length >= 3) {
    const month = parseInt(parts[0]) - 1 // 0-indexed
    const day = parseInt(parts[1])
    const year = parseInt(parts[2])
    
    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  return null
}

// Calculate course publishing frequency insights
function calculateCourseInsights(courses: IncomeEntry[]) {
  // Sort courses by invoice date
  const coursesWithDates = courses
    .map(c => ({ ...c, parsedDate: parseInvoiceDate(c.invoiceDate) }))
    .filter(c => c.parsedDate !== null)
    .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime())

  if (coursesWithDates.length < 2) {
    return {
      shortestGap: null,
      longestGap: null,
      avgGapDays: 0,
      totalCourses: courses.length,
      firstCourse: coursesWithDates[0] || null,
      lastCourse: coursesWithDates[coursesWithDates.length - 1] || null,
      coursesThisYear: 0,
      coursesLastYear: 0
    }
  }

  // Calculate gaps between consecutive courses
  const gaps: { days: number; from: typeof coursesWithDates[0]; to: typeof coursesWithDates[0] }[] = []
  
  for (let i = 1; i < coursesWithDates.length; i++) {
    const prev = coursesWithDates[i - 1]
    const curr = coursesWithDates[i]
    const diffTime = curr.parsedDate!.getTime() - prev.parsedDate!.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    gaps.push({
      days: diffDays,
      from: prev,
      to: curr
    })
  }

  // Find shortest and longest gaps
  const sortedGaps = [...gaps].sort((a, b) => a.days - b.days)
  const shortestGap = sortedGaps[0]
  const longestGap = sortedGaps[sortedGaps.length - 1]
  
  // Calculate average gap
  const totalGapDays = gaps.reduce((sum, g) => sum + g.days, 0)
  const avgGapDays = gaps.length > 0 ? Math.round(totalGapDays / gaps.length) : 0

  // Count courses by year
  const currentYear = new Date().getFullYear()
  const coursesThisYear = coursesWithDates.filter(c => c.parsedDate!.getFullYear() === currentYear).length
  const coursesLastYear = coursesWithDates.filter(c => c.parsedDate!.getFullYear() === currentYear - 1).length

  return {
    shortestGap: shortestGap ? {
      days: shortestGap.days,
      fromCourse: shortestGap.from.description,
      toCourse: shortestGap.to.description,
      fromDate: shortestGap.from.invoiceDate,
      toDate: shortestGap.to.invoiceDate
    } : null,
    longestGap: longestGap ? {
      days: longestGap.days,
      fromCourse: longestGap.from.description,
      toCourse: longestGap.to.description,
      fromDate: longestGap.from.invoiceDate,
      toDate: longestGap.to.invoiceDate
    } : null,
    avgGapDays,
    totalCourses: courses.length,
    firstCourse: {
      name: coursesWithDates[0].description,
      date: coursesWithDates[0].invoiceDate
    },
    lastCourse: {
      name: coursesWithDates[coursesWithDates.length - 1].description,
      date: coursesWithDates[coursesWithDates.length - 1].invoiceDate
    },
    coursesThisYear,
    coursesLastYear
  }
}

// Helper to categorize income entries
function categorizeEntry(description: string): 'course' | 'royalty' | 'miscellaneous' {
  const lowerDesc = description.toLowerCase()
  
  // Courses have "Published" in the name
  if (lowerDesc.includes('published')) {
    return 'course'
  }
  
  // Quarterly royalties have Q1, Q2, Q3, Q4 Author Fees
  if (/q[1-4]\s*(author\s*fees|royalt)/i.test(description)) {
    return 'royalty'
  }
  
  // Everything else is miscellaneous
  return 'miscellaneous'
}

interface TaxSummary {
  fy: string
  totalReceivedUSD: number
  totalReceivedINR: number
  otherTaxes: number
  totalTaxDue: number
  paymentDone: number
  paymentDue: number
}

interface FYSummary {
  fy: string
  totalUSD: number
  totalINR: number
  courseCount: number
  avgCourseEarning: number
  paidCount: number
  pendingCount: number
  pendingAmount: number
}

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cached = cache.get('other-income')
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached other-income data')
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

    // Fetch income entries from Other Income Analytics sheet
    const incomeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Other Income Analytics!A:H',
    })

    const incomeRows = incomeResponse.data.values || []
    
    // Parse income entries (skip header row)
    const incomeEntries: IncomeEntry[] = []
    for (let i = 1; i < incomeRows.length; i++) {
      const row = incomeRows[i]
      if (!row[0]) continue // Skip empty rows
      
      const parseAmount = (val: string): number => {
        if (!val) return 0
        const cleaned = val.toString().replace(/[₹$,\s]/g, '')
        return parseFloat(cleaned) || 0
      }

      const description = row[0]?.toString() || ''
      incomeEntries.push({
        description,
        status: row[1]?.toString() || '',
        fy: row[2]?.toString() || '',
        invoiceDate: row[3]?.toString() || '',
        totalUSD: parseAmount(row[4]),
        estimate: parseAmount(row[5]),
        actual: parseAmount(row[6]),
        rateConversion: parseFloat(row[7]) || 0,
        category: categorizeEntry(description)
      })
    }

    // Fetch tax summary data (columns J onwards in same sheet)
    const taxResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Other Income Analytics!J:P',
    })

    const taxRows = taxResponse.data.values || []
    
    // Parse tax summary (skip header row)
    const taxSummaries: TaxSummary[] = []
    for (let i = 1; i < taxRows.length; i++) {
      const row = taxRows[i]
      if (!row[0]) continue // Skip empty rows
      
      const fyValue = row[0]?.toString() || ''
      
      // Skip header-like rows and total rows
      if (fyValue.toLowerCase().includes('financial year') || 
          fyValue.toLowerCase() === 'total' ||
          fyValue.toLowerCase().includes('fy total')) {
        continue
      }
      
      const parseAmount = (val: string): number => {
        if (!val) return 0
        const cleaned = val.toString().replace(/[₹$,\s]/g, '')
        return parseFloat(cleaned) || 0
      }

      taxSummaries.push({
        fy: fyValue,
        totalReceivedUSD: parseAmount(row[1]),
        totalReceivedINR: parseAmount(row[2]),
        otherTaxes: parseAmount(row[3]),
        totalTaxDue: parseAmount(row[4]),
        paymentDone: parseAmount(row[5]),
        paymentDue: parseAmount(row[6])
      })
    }

    // Calculate FY-wise summaries
    const fyMap = new Map<string, FYSummary>()
    
    for (const entry of incomeEntries) {
      if (!entry.fy) continue
      
      const existing = fyMap.get(entry.fy) || {
        fy: entry.fy,
        totalUSD: 0,
        totalINR: 0,
        courseCount: 0,
        avgCourseEarning: 0,
        paidCount: 0,
        pendingCount: 0,
        pendingAmount: 0
      }

      existing.totalUSD += entry.totalUSD
      existing.totalINR += entry.actual || entry.estimate
      existing.courseCount += 1
      
      if (entry.status === 'Paid') {
        existing.paidCount += 1
      } else {
        existing.pendingCount += 1
        existing.pendingAmount += entry.actual || entry.estimate
      }

      fyMap.set(entry.fy, existing)
    }

    // Calculate averages
    const fySummaries = Array.from(fyMap.values()).map(fy => ({
      ...fy,
      avgCourseEarning: fy.courseCount > 0 ? fy.totalINR / fy.courseCount : 0
    }))

    // Sort by FY (most recent first)
    fySummaries.sort((a, b) => b.fy.localeCompare(a.fy))

    // Categorize entries
    const courses = incomeEntries.filter(e => e.category === 'course')
    const royalties = incomeEntries.filter(e => e.category === 'royalty')
    const miscellaneous = incomeEntries.filter(e => e.category === 'miscellaneous')

    // Calculate overall totals
    const totalEarningsUSD = incomeEntries.reduce((sum, e) => sum + e.totalUSD, 0)
    const totalEarningsINR = incomeEntries.reduce((sum, e) => sum + (e.actual || e.estimate), 0)
    const totalCourses = courses.length
    const paidCourses = courses.filter(e => e.status === 'Paid').length
    
    // Pending = entries with "To be Paid" status (check exact status value from Column B)
    const pendingEntries = incomeEntries.filter(e => 
      e.status.toLowerCase().includes('to be paid') || 
      e.status.toLowerCase() === 'pending' ||
      e.status.toLowerCase() === 'unpaid'
    )
    const pendingPayments = pendingEntries.reduce((sum, e) => sum + (e.actual || e.estimate), 0)
    const pendingCount = pendingEntries.length
    
    // Category-wise totals
    const courseEarnings = courses.reduce((sum, e) => sum + (e.actual || e.estimate), 0)
    const royaltyEarnings = royalties.reduce((sum, e) => sum + (e.actual || e.estimate), 0)
    const miscEarnings = miscellaneous.reduce((sum, e) => sum + (e.actual || e.estimate), 0)

    // Tax totals
    const totalTaxesPaid = taxSummaries.reduce((sum, t) => sum + t.paymentDone, 0)
    const totalTaxesDue = taxSummaries.reduce((sum, t) => sum + t.paymentDue, 0)
    const totalTaxLiability = taxSummaries.reduce((sum, t) => sum + t.totalTaxDue, 0)
    const effectiveTaxRate = totalEarningsINR > 0 
      ? ((totalTaxLiability / totalEarningsINR) * 100) 
      : 0
    
    // Calculate avg course earning (only from actual courses, not royalties)
    const avgCourseEarning = courses.length > 0 ? courseEarnings / courses.length : 0

    // Top earning courses (only actual courses with "Published")
    const topCourses = [...courses]
      .sort((a, b) => (b.actual || b.estimate) - (a.actual || a.estimate))
      .slice(0, 5)

    // Calculate course publishing frequency insights
    const courseInsights = calculateCourseInsights(courses)

    // Monthly earnings trend (group by month)
    const monthlyTrend: { month: string; amount: number; usd: number }[] = []
    const monthMap = new Map<string, { amount: number; usd: number }>()
    
    for (const entry of incomeEntries) {
      if (!entry.invoiceDate) continue
      
      // Parse date - handle various formats
      let monthKey = ''
      const dateParts = entry.invoiceDate.split('/')
      if (dateParts.length >= 2) {
        const month = parseInt(dateParts[0])
        const year = parseInt(dateParts[2])
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthKey = `${monthNames[month - 1]} ${year}`
      }

      if (monthKey) {
        const existing = monthMap.get(monthKey) || { amount: 0, usd: 0 }
        existing.amount += entry.actual || entry.estimate
        existing.usd += entry.totalUSD
        monthMap.set(monthKey, existing)
      }
    }

    // Convert to array and sort by date
    Array.from(monthMap.entries()).forEach(([month, data]) => {
      monthlyTrend.push({ month, ...data })
    })
    
    // Sort chronologically
    monthlyTrend.sort((a, b) => {
      const parseDate = (m: string) => {
        const parts = m.split(' ')
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return new Date(parseInt(parts[1]), months.indexOf(parts[0]))
      }
      return parseDate(a.month).getTime() - parseDate(b.month).getTime()
    })

    // Get current FY (April to March)
    const now = new Date()
    const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const currentFY = `${currentFYStart}-${(currentFYStart + 1).toString().slice(-2)}`

    const currentFYData = fySummaries.find(f => f.fy === currentFY)
    const previousFYData = fySummaries.find(f => f.fy !== currentFY)

    // YoY Growth
    const yoyGrowth = previousFYData && previousFYData.totalINR > 0
      ? ((currentFYData?.totalINR || 0) - previousFYData.totalINR) / previousFYData.totalINR * 100
      : 0

    const result = {
      // Summary stats
      summary: {
        totalEarningsUSD,
        totalEarningsINR,
        totalCourses,
        paidCourses,
        pendingPayments,
        pendingCount, // Only entries with "To be Paid" status
        avgCourseEarning, // Only from actual courses (with "Published")
        avgConversionRate: incomeEntries.length > 0 
          ? incomeEntries.reduce((sum, e) => sum + e.rateConversion, 0) / incomeEntries.length 
          : 0
      },
      
      // Category breakdown
      categories: {
        courses: {
          count: courses.length,
          totalINR: courseEarnings,
          entries: courses
        },
        royalties: {
          count: royalties.length,
          totalINR: royaltyEarnings,
          entries: royalties
        },
        miscellaneous: {
          count: miscellaneous.length,
          totalINR: miscEarnings,
          entries: miscellaneous
        }
      },
      
      // Tax summary
      taxes: {
        totalTaxesPaid,
        totalTaxesDue,
        totalTaxLiability,
        effectiveTaxRate,
        byFY: taxSummaries
      },

      // FY breakdown
      fyBreakdown: fySummaries,
      
      // Current vs Previous FY
      fyComparison: {
        currentFY,
        currentFYData,
        previousFYData,
        yoyGrowth
      },

      // Top courses
      topCourses,
      
      // Course publishing insights
      courseInsights,
      
      // All entries for detailed view
      entries: incomeEntries,
      
      // Monthly trend
      monthlyTrend
    }

    // Cache the result
    cache.set('other-income', { data: result, timestamp: Date.now() })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching other income data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch other income data' },
      { status: 500 }
    )
  }
}
