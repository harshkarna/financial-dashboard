import { NextResponse } from 'next/server'
import { kiteRequest, Holding } from '@/lib/zerodha'

export async function GET() {
  try {
    const holdings: Holding[] = await kiteRequest('/portfolio/holdings')
    
    // Calculate summary stats
    const totalInvestment = holdings.reduce(
      (sum, h) => sum + h.quantity * h.average_price, 
      0
    )
    const totalCurrentValue = holdings.reduce(
      (sum, h) => sum + h.quantity * h.last_price, 
      0
    )
    const totalPnL = holdings.reduce((sum, h) => sum + h.pnl, 0)
    const totalDayChange = holdings.reduce(
      (sum, h) => sum + (h.last_price - h.close_price) * h.quantity, 
      0
    )
    const overallReturnPercent = totalInvestment > 0 
      ? ((totalCurrentValue - totalInvestment) / totalInvestment) * 100 
      : 0
    const dayChangePercent = totalCurrentValue > 0 
      ? (totalDayChange / (totalCurrentValue - totalDayChange)) * 100 
      : 0

    // Format holdings for UI
    const formattedHoldings = holdings.map(h => ({
      symbol: h.tradingsymbol,
      exchange: h.exchange,
      isin: h.isin,
      quantity: h.quantity,
      avgPrice: h.average_price,
      lastPrice: h.last_price,
      closePrice: h.close_price,
      invested: h.quantity * h.average_price,
      currentValue: h.quantity * h.last_price,
      pnl: h.pnl,
      pnlPercent: h.average_price > 0 
        ? ((h.last_price - h.average_price) / h.average_price) * 100 
        : 0,
      dayChange: (h.last_price - h.close_price) * h.quantity,
      dayChangePercent: h.day_change_percentage,
    }))

    // Sort by current value (highest first)
    formattedHoldings.sort((a, b) => b.currentValue - a.currentValue)

    return NextResponse.json({
      holdings: formattedHoldings,
      summary: {
        totalInvestment,
        totalCurrentValue,
        totalPnL,
        overallReturnPercent,
        totalDayChange,
        dayChangePercent,
        stockCount: holdings.length,
      },
    })
  } catch (error) {
    console.error('Holdings API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch holdings',
        holdings: [],
        summary: null,
      },
      { status: error instanceof Error && error.message.includes('Not authenticated') ? 401 : 500 }
    )
  }
}

