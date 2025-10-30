import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const isDevelopment = process.env.NODE_ENV === 'development'

export const authOptions: NextAuthOptions = {
  debug: isDevelopment, // Enable debug logs in development
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: {
          scope: [
            'openid',
            'email', 
            'profile',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.readonly'
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
          response_type: 'code',
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: isDevelopment ? 24 * 60 * 60 : 7 * 24 * 60 * 60, // 1 day for dev, 7 days for prod
    updateAge: isDevelopment ? 24 * 60 * 60 : 60 * 60, // 24 hours for dev, 1 hour for prod
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (isDevelopment) {
        console.log('JWT Callback - Account:', !!account, 'User:', !!user, 'Token expires at:', token.expiresAt)
      }

      // Initial sign in
      if (account && user) {
        if (isDevelopment) {
          console.log('Initial sign in, setting up token')
          console.log('Account scope:', account.scope)
        }
        
        // Check if we have the required scopes
        const requiredScope = 'https://www.googleapis.com/auth/spreadsheets'
        const hasRequiredScope = account.scope?.includes(requiredScope)
        
        if (!hasRequiredScope) {
          console.error('Missing required Google Sheets scope!')
          return {
            ...token,
            error: 'InsufficientScope'
          }
        }
        
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          user,
        }
      }

      // In development, be very lenient with token expiration
      if (isDevelopment) {
        // For development, only refresh if token is really old (more than 12 hours)
        const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000)
        if (token.expiresAt && ((token.expiresAt as number) * 1000) > twelveHoursAgo) {
          return token
        }
      } else {
        // Production: Return previous token if the access token has not expired yet
        // Add buffer time to prevent edge cases
        if (token.expiresAt && Date.now() < ((token.expiresAt as number) * 1000) - 60000) {
          return token
        }
      }

      // Access token has expired or about to expire, try to refresh it
      if (token.refreshToken) {
        try {
          console.log('Refreshing access token...')
          
          const response = await fetch('https://oauth2.googleapis.com/token', {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
            method: 'POST',
          })

          const tokens = await response.json()

          if (!response.ok) {
            console.error('Failed to refresh token:', tokens)
            // In development, be more lenient with token refresh failures
            if (isDevelopment) {
              console.log('Development mode: Continuing with existing token despite refresh failure')
              return {
                ...token,
                error: undefined, // Clear any previous errors
              }
            } else {
              throw tokens
            }
          }

          console.log('Token refreshed successfully')
          
          return {
            ...token,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
            refreshToken: tokens.refresh_token ?? token.refreshToken,
            error: undefined,
          }
        } catch (error) {
          console.error('Error refreshing access token:', error)
          // Token is invalid, force re-authentication
          return { 
            ...token, 
            error: 'RefreshAccessTokenError',
            accessToken: undefined,
          }
        }
      }

      // If no refresh token, force re-authentication
      console.log('No refresh token available, forcing re-authentication')
      return { ...token, error: 'RefreshAccessTokenError' }
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.error = token.error as string
      
      // If there's an error or no access token, force logout
      if (token.error === 'RefreshAccessTokenError' || !token.accessToken) {
        console.log('Session error detected, forcing logout')
        session.error = 'RefreshAccessTokenError'
      }
      
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }