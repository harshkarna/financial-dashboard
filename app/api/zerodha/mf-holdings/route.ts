import { NextResponse } from 'next/server'
import { kiteRequest } from '@/lib/zerodha'

interface MFHolding {
  folio: string
  fund: string
  tradingsymbol: string
  average_price: number
  last_price: number
  last_price_date: string
  pnl: number
  quantity: number
}

// Common ISIN to fund name mapping for better display
const FUND_NAMES: Record<string, string> = {
  'INF879O01027': 'Parag Parikh Flexi Cap Fund',
  'INF879O01HH0': 'Parag Parikh Flexi Cap Direct',
  'INF769K01HH0': 'ICICI Pru Nifty 50 Index Fund',
  'INF769K01BI1': 'ICICI Pru Technology Direct',
  'INF663L01FF1': 'ICICI Pru NASDAQ 100 Index',
  'INF966L01911': 'SBI Small Cap Fund Direct',
  'INF789F1AUT5': 'Axis Small Cap Direct',
  'INF194KB1AL4': 'Motilal Oswal Midcap Direct',
  'INF109K01BN2': 'UTI Nifty 50 Index Fund',
  'INF277KA1612': 'Tata Digital India Direct',
  'INF879O01Z48': 'PPFAS Tax Saver Direct',
  'INF174K01LS2': 'Kotak Emerging Equity Direct',
}

function getFundDisplayName(holding: MFHolding): string {
  // First try the fund field from API
  if (holding.fund && holding.fund.length > 3 && !holding.fund.startsWith('INF')) {
    return holding.fund
  }
  // Then try our mapping
  if (FUND_NAMES[holding.tradingsymbol]) {
    return FUND_NAMES[holding.tradingsymbol]
  }
  // Fallback: clean up the trading symbol
  return holding.tradingsymbol.replace(/INF[A-Z0-9]+/, '').trim() || holding.tradingsymbol
}

export async function GET() {
  try {
    const mfHoldings: MFHolding[] = await kiteRequest('/mf/holdings')
    
    console.log('MF Holdings from Kite:', JSON.stringify(mfHoldings.slice(0, 2), null, 2))
    
    // Format holdings for UI - calculate P&L manually since API may return 0
    const formattedHoldings = mfHoldings.map(h => {
      const invested = h.quantity * h.average_price
      const currentValue = h.quantity * h.last_price
      // Use API pnl if available, otherwise calculate
      const pnl = h.pnl !== 0 ? h.pnl : (currentValue - invested)
      const pnlPercent = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0
      
      return {
        symbol: h.tradingsymbol,
        name: getFundDisplayName(h),
        folio: h.folio,
        quantity: h.quantity,
        avgPrice: h.average_price,
        lastPrice: h.last_price,
        lastPriceDate: h.last_price_date,
        invested,
        currentValue,
        pnl,
        pnlPercent,
      }
    })
    
    // Calculate summary stats from formatted holdings
    const totalInvestment = formattedHoldings.reduce((sum, h) => sum + h.invested, 0)
    const totalCurrentValue = formattedHoldings.reduce((sum, h) => sum + h.currentValue, 0)
    const totalPnL = formattedHoldings.reduce((sum, h) => sum + h.pnl, 0)
    const overallReturnPercent = totalInvestment > 0 
      ? ((totalCurrentValue - totalInvestment) / totalInvestment) * 100 
      : 0
    
    console.log('MF Summary:', { totalInvestment, totalCurrentValue, totalPnL, overallReturnPercent })

    // Sort by current value (highest first)
    formattedHoldings.sort((a, b) => b.currentValue - a.currentValue)

    return NextResponse.json({
      holdings: formattedHoldings,
      summary: {
        totalInvestment,
        totalCurrentValue,
        totalPnL,
        overallReturnPercent,
        fundCount: mfHoldings.length,
      },
    })
  } catch (error) {
    console.error('MF Holdings API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch MF holdings',
        holdings: [],
        summary: null,
      },
      { status: error instanceof Error && error.message.includes('Not authenticated') ? 401 : 500 }
    )
  }
}

