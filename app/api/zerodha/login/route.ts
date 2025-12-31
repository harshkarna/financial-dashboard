import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.KITE_API_KEY
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Kite API key not configured' },
      { status: 500 }
    )
  }

  // Redirect to Kite Connect login page
  const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`
  
  return NextResponse.redirect(loginUrl)
}

