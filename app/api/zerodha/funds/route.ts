import { NextResponse } from 'next/server'
import { kiteRequest, Margins } from '@/lib/zerodha'

export async function GET() {
  try {
    const margins: Margins = await kiteRequest('/user/margins')
    
    // Format funds data
    const equity = margins.equity
    const commodity = margins.commodity

    return NextResponse.json({
      equity: {
        available: equity.net,
        cash: equity.available.cash,
        collateral: equity.available.collateral,
        openingBalance: equity.available.opening_balance,
        utilised: {
          total: Object.values(equity.utilised).reduce((a, b) => a + b, 0),
          delivery: equity.utilised.delivery,
          exposure: equity.utilised.exposure,
          optionPremium: equity.utilised.option_premium,
        },
      },
      commodity: {
        available: commodity.net,
        cash: commodity.available.cash,
        collateral: commodity.available.collateral,
      },
      summary: {
        totalAvailable: equity.net + commodity.net,
        totalCash: equity.available.cash + commodity.available.cash,
        equityNet: equity.net,
        commodityNet: commodity.net,
      },
    })
  } catch (error) {
    console.error('Funds API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch funds',
        equity: null,
        commodity: null,
        summary: null,
      },
      { status: error instanceof Error && error.message.includes('Not authenticated') ? 401 : 500 }
    )
  }
}

