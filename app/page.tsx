'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { Dashboard } from '@/components/Dashboard'
import { EarningsBreakdown } from '@/components/EarningsBreakdown'
import { MonthlyBudget } from '@/components/MonthlyBudget'
import { Investments } from '@/components/Investments'
import { OtherIncomeAnalytics } from '@/components/OtherIncomeAnalytics'
import { ForecastPage } from '@/components/forecast/ForecastPage'
import { HomeHub } from '@/components/HomeHub'
import { LoginCard } from '@/components/LoginCard'
import { DashboardSelector, DashboardId } from '@/components/DashboardSelector'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function Home() {
  const { data: session, status } = useSession()
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardId>('home')
  const searchParams = useSearchParams()
  const [zerodhaMessage, setZerodhaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Handle Zerodha OAuth callback
  useEffect(() => {
    const zerodhaStatus = searchParams.get('zerodha')
    const zerodhaUser = searchParams.get('user')
    const zerodhaError = searchParams.get('message')

    if (zerodhaStatus === 'success') {
      setZerodhaMessage({ type: 'success', text: `Connected to Zerodha as ${zerodhaUser}!` })
      setSelectedDashboard('investments')
      window.history.replaceState({}, '', '/')
      setTimeout(() => setZerodhaMessage(null), 5000)
    } else if (zerodhaStatus === 'error') {
      setZerodhaMessage({ type: 'error', text: zerodhaError || 'Failed to connect to Zerodha' })
      window.history.replaceState({}, '', '/')
      setTimeout(() => setZerodhaMessage(null), 5000)
    }
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0e14]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-white/10" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading your dashboard…</p>
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
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#0b0e14] transition-colors duration-300">
        {/* Premium ambient glow */}
        <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.10),transparent_70%)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.14),transparent_70%)]" />

        {/* Zerodha connection toast */}
        {zerodhaMessage && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-scale-in ${
              zerodhaMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${zerodhaMessage.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {zerodhaMessage.text}
          </div>
        )}
        
        <MotionConfig reducedMotion="user">
          <DashboardSelector
            selectedDashboard={selectedDashboard}
            onDashboardChange={setSelectedDashboard}
            session={session}
            onSignOut={() => signOut()}
          />

          <main className="relative pb-4 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDashboard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {selectedDashboard === 'home' ? (
                  <HomeHub session={session} onNavigate={setSelectedDashboard} />
                ) : selectedDashboard === 'networth' ? (
                  <Dashboard session={session} onSignOut={() => signOut()} onNavigateToForecast={() => setSelectedDashboard('forecast')} />
                ) : selectedDashboard === 'earnings' ? (
                  <EarningsBreakdown session={session} onSignOut={() => signOut()} />
                ) : selectedDashboard === 'budget' ? (
                  <MonthlyBudget />
                ) : selectedDashboard === 'investments' ? (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Investments />
                  </div>
                ) : selectedDashboard === 'forecast' ? (
                  <ForecastPage />
                ) : (
                  <OtherIncomeAnalytics />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </MotionConfig>
      </div>
    </ThemeProvider>
  )
}
