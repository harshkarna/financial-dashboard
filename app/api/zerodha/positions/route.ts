import { NextResponse } from 'next/server'
import { kiteRequest, Position } from '@/lib/zerodha'

interface PositionsResponse {
  net: Position[]
  day: Position[]
}

export async function GET() {
  try {
    const positions: PositionsResponse = await kiteRequest('/portfolio/positions')
    
    // Format net positions
    const netPositions = positions.net.map(p => ({
      symbol: p.tradingsymbol,
      exchange: p.exchange,
      product: p.product,
      quantity: p.quantity,
      avgPrice: p.average_price,
      lastPrice: p.last_price,
      pnl: p.pnl,
      m2m: p.m2m,
      value: p.quantity * p.last_price,
      realised: p.realised,
      unrealised: p.unrealised,
    }))

    // Format day positions
    const dayPositions = positions.day.map(p => ({
      symbol: p.tradingsymbol,
      exchange: p.exchange,
      product: p.product,
      quantity: p.quantity,
      avgPrice: p.average_price,
      lastPrice: p.last_price,
      pnl: p.pnl,
      m2m: p.m2m,
      value: p.quantity * p.last_price,
      realised: p.realised,
      unrealised: p.unrealised,
    }))

    // Calculate totals
    const totalNetPnL = positions.net.reduce((sum, p) => sum + p.pnl, 0)
    const totalDayPnL = positions.day.reduce((sum, p) => sum + p.pnl, 0)
    const totalRealised = positions.net.reduce((sum, p) => sum + p.realised, 0)
    const totalUnrealised = positions.net.reduce((sum, p) => sum + p.unrealised, 0)

    return NextResponse.json({
      net: netPositions,
      day: dayPositions,
      summary: {
        totalNetPnL,
        totalDayPnL,
        totalRealised,
        totalUnrealised,
        netCount: positions.net.length,
        dayCount: positions.day.length,
      },
    })
  } catch (error) {
    console.error('Positions API error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch positions',
        net: [],
        day: [],
        summary: null,
      },
      { status: error instanceof Error && error.message.includes('Not authenticated') ? 401 : 500 }
    )
  }
}

