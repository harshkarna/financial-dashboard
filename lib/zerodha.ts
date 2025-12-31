// Shared Zerodha utilities
// Note: Token is stored in cookies for persistence across API routes

import { cookies } from 'next/headers'

const TOKEN_COOKIE = 'zerodha_token'
const USER_COOKIE = 'zerodha_user'
const EXPIRY_COOKIE = 'zerodha_expiry'

export function getStoredToken() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(TOKEN_COOKIE)?.value || null
    const userName = cookieStore.get(USER_COOKIE)?.value || null
    const expiryStr = cookieStore.get(EXPIRY_COOKIE)?.value
    const expiry = expiryStr ? new Date(expiryStr) : null
    
    const isValid = token !== null && expiry !== null && new Date() < expiry
    
    return { token, expiry, userName, isValid }
  } catch {
    // cookies() might not be available in some contexts
    return { token: null, expiry: null, userName: null, isValid: false }
  }
}

export function setStoredToken(token: string, user: string) {
  try {
    const cookieStore = cookies()
    
    // Token expires at 6 AM next day
    const tomorrow6AM = new Date()
    tomorrow6AM.setDate(tomorrow6AM.getDate() + 1)
    tomorrow6AM.setHours(6, 0, 0, 0)
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      expires: tomorrow6AM,
      path: '/',
    }
    
    cookieStore.set(TOKEN_COOKIE, token, cookieOptions)
    cookieStore.set(USER_COOKIE, user, cookieOptions)
    cookieStore.set(EXPIRY_COOKIE, tomorrow6AM.toISOString(), cookieOptions)
    
    console.log('Zerodha token stored in cookies')
    console.log('User:', user)
    console.log('Expires:', tomorrow6AM)
  } catch (error) {
    console.error('Error storing token in cookies:', error)
  }
}

export function clearStoredToken() {
  try {
    const cookieStore = cookies()
    cookieStore.delete(TOKEN_COOKIE)
    cookieStore.delete(USER_COOKIE)
    cookieStore.delete(EXPIRY_COOKIE)
  } catch {
    // Ignore errors
  }
}

// API helper
export async function kiteRequest(endpoint: string, options: RequestInit = {}) {
  const { token, isValid } = getStoredToken()
  
  if (!isValid || !token) {
    throw new Error('Not authenticated with Zerodha')
  }

  const apiKey = process.env.KITE_API_KEY
  
  if (!apiKey) {
    throw new Error('Kite API key not configured')
  }

  const response = await fetch(`https://api.kite.trade${endpoint}`, {
    ...options,
    headers: {
      'X-Kite-Version': '3',
      'Authorization': `token ${apiKey}:${token}`,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (data.status === 'error') {
    // If token is invalid, clear it
    if (data.error_type === 'TokenException') {
      clearStoredToken()
    }
    throw new Error(data.message || 'Kite API error')
  }

  return data.data
}

// Types for Zerodha responses
export interface Holding {
  tradingsymbol: string
  exchange: string
  isin: string
  quantity: number
  authorised_quantity: number
  average_price: number
  last_price: number
  close_price: number
  pnl: number
  day_change: number
  day_change_percentage: number
  instrument_token: number
  product: string
  collateral_quantity: number
  collateral_type: string
  t1_quantity: number
}

export interface Position {
  tradingsymbol: string
  exchange: string
  instrument_token: number
  product: string
  quantity: number
  overnight_quantity: number
  multiplier: number
  average_price: number
  close_price: number
  last_price: number
  value: number
  pnl: number
  m2m: number
  unrealised: number
  realised: number
  buy_quantity: number
  buy_price: number
  buy_value: number
  buy_m2m: number
  sell_quantity: number
  sell_price: number
  sell_value: number
  sell_m2m: number
  day_buy_quantity: number
  day_buy_price: number
  day_buy_value: number
  day_sell_quantity: number
  day_sell_price: number
  day_sell_value: number
}

export interface Margins {
  equity: {
    enabled: boolean
    net: number
    available: {
      adhoc_margin: number
      cash: number
      opening_balance: number
      live_balance: number
      collateral: number
      intraday_payin: number
    }
    utilised: {
      debits: number
      exposure: number
      m2m_realised: number
      m2m_unrealised: number
      option_premium: number
      payout: number
      span: number
      holding_sales: number
      turnover: number
      liquid_collateral: number
      stock_collateral: number
      delivery: number
    }
  }
  commodity: {
    enabled: boolean
    net: number
    available: {
      adhoc_margin: number
      cash: number
      opening_balance: number
      live_balance: number
      collateral: number
      intraday_payin: number
    }
    utilised: {
      debits: number
      exposure: number
      m2m_realised: number
      m2m_unrealised: number
      option_premium: number
      payout: number
      span: number
      holding_sales: number
      turnover: number
      liquid_collateral: number
      stock_collateral: number
      delivery: number
    }
  }
}
