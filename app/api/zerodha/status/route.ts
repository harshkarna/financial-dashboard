import { NextResponse } from 'next/server'
import { getStoredToken, clearStoredToken } from '@/lib/zerodha'

// GET - Check connection status
export async function GET() {
  const { token, expiry, userName, isValid } = getStoredToken()
  
  return NextResponse.json({
    isConnected: isValid,
    userName: userName,
    expiresAt: expiry?.toISOString() || null,
    message: isValid 
      ? `Connected as ${userName}` 
      : 'Not connected. Please login to Zerodha.',
  })
}

// DELETE - Disconnect / clear token
export async function DELETE() {
  clearStoredToken()
  return NextResponse.json({
    success: true,
    message: 'Disconnected from Zerodha',
  })
}

