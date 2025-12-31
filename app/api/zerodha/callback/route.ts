import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const requestToken = searchParams.get('request_token')
  const status = searchParams.get('status')

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (status !== 'success' || !requestToken) {
    return NextResponse.redirect(`${baseUrl}?zerodha=error&message=Authorization failed`)
  }

  const apiKey = process.env.KITE_API_KEY
  const apiSecret = process.env.KITE_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.redirect(`${baseUrl}?zerodha=error&message=API credentials not configured`)
  }

  try {
    // Generate checksum: SHA256(api_key + request_token + api_secret)
    const checksum = crypto
      .createHash('sha256')
      .update(apiKey + requestToken + apiSecret)
      .digest('hex')

    // Exchange request token for access token
    const response = await fetch('https://api.kite.trade/session/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        request_token: requestToken,
        checksum: checksum,
      }),
    })

    const data = await response.json()

    if (data.status === 'error') {
      throw new Error(data.message || 'Failed to get access token')
    }

    const accessToken = data.data.access_token
    const userName = data.data.user_name

    console.log('Zerodha access token obtained successfully')
    console.log('User:', userName)

    // Token expires at 6 AM next day
    const tomorrow6AM = new Date()
    tomorrow6AM.setDate(tomorrow6AM.getDate() + 1)
    tomorrow6AM.setHours(6, 0, 0, 0)

    // Create redirect response with cookies
    const redirectResponse = NextResponse.redirect(
      `${baseUrl}?zerodha=success&user=${encodeURIComponent(userName)}`
    )

    // Set cookies on the response
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      expires: tomorrow6AM,
      path: '/',
    }

    redirectResponse.cookies.set('zerodha_token', accessToken, cookieOptions)
    redirectResponse.cookies.set('zerodha_user', userName, cookieOptions)
    redirectResponse.cookies.set('zerodha_expiry', tomorrow6AM.toISOString(), cookieOptions)

    console.log('Cookies set, redirecting...')

    return redirectResponse
  } catch (error) {
    console.error('Zerodha callback error:', error)
    return NextResponse.redirect(
      `${baseUrl}?zerodha=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    )
  }
}
