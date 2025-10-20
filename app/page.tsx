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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return <LoginCard onSignIn={() => signIn('google')} />
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <DashboardSelector 
          selectedDashboard={selectedDashboard}
          onDashboardChange={setSelectedDashboard}
          session={session}
          onSignOut={() => signOut()}
        />
        
        {selectedDashboard === 'networth' ? (
          <Dashboard session={session} onSignOut={() => signOut()} />
        ) : selectedDashboard === 'earnings' ? (
          <EarningsBreakdown session={session} onSignOut={() => signOut()} />
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <MonthlyBudget />
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}