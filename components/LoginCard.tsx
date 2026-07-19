'use client'

import { useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  CircleDollarSign,
  Wallet,
  PiggyBank,
  CandlestickChart,
  LineChart,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

interface LoginCardProps {
  onSignIn: () => void
}

const EASE = [0.22, 1, 0.36, 1] as const

const features = [
  { icon: Wallet, label: 'Net worth & wealth trends', color: 'text-emerald-400' },
  { icon: PiggyBank, label: 'Budgets & savings rate', color: 'text-violet-400' },
  { icon: CandlestickChart, label: 'Investments & portfolio', color: 'text-amber-400' },
  { icon: LineChart, label: 'Forecasts & scenarios', color: 'text-sky-400' },
]

export function LoginCard({ onSignIn }: LoginCardProps) {
  const reduce = useReducedMotion()
  const [connecting, setConnecting] = useState(false)

  const handleSignIn = () => {
    setConnecting(true)
    onSignIn()
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.1 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  }

  const orbTransition = (duration: number) => ({
    duration,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080a10] text-white">
      {/* Animated aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-indigo-600/30 blur-[120px]"
          animate={reduce ? undefined : { x: [0, 60, -30, 0], y: [0, 40, -20, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={orbTransition(20)}
        />
        <motion.div
          className="absolute top-1/3 -right-24 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[120px]"
          animate={reduce ? undefined : { x: [0, -50, 30, 0], y: [0, -30, 30, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={orbTransition(24)}
        />
        <motion.div
          className="absolute -bottom-32 left-1/4 h-[30rem] w-[30rem] rounded-full bg-emerald-500/15 blur-[120px]"
          animate={reduce ? undefined : { x: [0, 40, -40, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={orbTransition(26)}
        />
        {/* Fine grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — hero */}
          <motion.div variants={container} initial="hidden" animate="show" className="text-center lg:text-left">
            <motion.div variants={item} className="inline-flex items-center gap-3 mb-6">
              <div className="relative grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <CircleDollarSign className="w-6 h-6 text-white" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#080a10]" />
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight">Financial Hub</span>
            </motion.div>

            <motion.h1 variants={item} className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
              Your money,
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                beautifully in focus.
              </span>
            </motion.h1>

            <motion.p variants={item} className="mt-5 text-lg text-slate-300/90 max-w-md mx-auto lg:mx-0 leading-relaxed">
              Turn your Google Sheets into a living financial command center. Net worth, budgets, investments and forecasts, all in one place.
            </motion.p>

            <motion.ul variants={item} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <li key={f.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 backdrop-blur-sm">
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${f.color}`} />
                    <span className="text-sm text-slate-200">{f.label}</span>
                  </li>
                )
              })}
            </motion.ul>
          </motion.div>

          {/* Right — sign-in card */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: reduce ? 0 : 0.2 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="relative rounded-3xl p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent">
              <div className="rounded-3xl bg-[#0d1018]/80 backdrop-blur-xl p-8 shadow-2xl">
                <div className="text-center mb-7">
                  <h2 className="text-2xl font-bold">Welcome back</h2>
                  <p className="mt-1.5 text-sm text-slate-400">Sign in to open your dashboard</p>
                </div>

                <motion.button
                  onClick={handleSignIn}
                  disabled={connecting}
                  whileHover={reduce ? undefined : { scale: 1.02 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-6 py-3.5 font-semibold text-slate-800 shadow-lg disabled:opacity-80 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/40"
                >
                  {/* sheen */}
                  {!reduce && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-black/[0.06] to-transparent"
                      animate={{ x: ['0%', '400%'] }}
                      transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
                    />
                  )}
                  {connecting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                      <span>Connecting…</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </motion.button>

                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Read-only access
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> No data stored
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">
              By continuing you allow secure, read-only access to your Google Sheets.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
