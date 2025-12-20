'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Dashboard } from '@/components/Dashboard'
import { EarningsBreakdown } from '@/components/EarningsBreakdown'
import { MonthlyBudget } from '@/components/MonthlyBudget'
import { LoginCard } from '@/components/LoginCard'
import { DashboardSelector } from '@/components/DashboardSelector'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function Home() {
  const { data: session, status } = useSession()
  const [selectedDashboard, setSelectedDashboard] = useState<'networth' | 'earnings' | 'budget'>('networth')

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Handle authentication errors gracefully for development
  if (!session || (session as any)?.error === 'RefreshAccessTokenError') {
    if ((session as any)?.error) {
      console.log('Authentication error detected, redirecting to login')
    }
    return <LoginCard onSignIn={() => signIn('google')} />
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Qzk5QUUiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50 dark:opacity-20 pointer-events-none" />
        
        <DashboardSelector 
          selectedDashboard={selectedDashboard}
          onDashboardChange={setSelectedDashboard}
          session={session}
          onSignOut={() => signOut()}
        />
        
        <main className="relative pb-4 md:pb-8">
          {selectedDashboard === 'networth' ? (
            <Dashboard session={session} onSignOut={() => signOut()} />
          ) : selectedDashboard === 'earnings' ? (
            <EarningsBreakdown session={session} onSignOut={() => signOut()} />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <MonthlyBudget />
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}
