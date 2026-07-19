'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Session } from 'next-auth'
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  CandlestickChart,
  GraduationCap,
  LineChart,
  ArrowRight,
} from 'lucide-react'
import type { DashboardId } from './DashboardSelector'
import { CosmicBackground } from './motion/CosmicBackground'

const EASE = [0.22, 1, 0.36, 1] as const

type Section = {
  id: Exclude<DashboardId, 'home'>
  label: string
  desc: string
  icon: typeof Wallet
  /** tailwind text + bg tint for the icon chip */
  chip: string
  /** hover ring color */
  ring: string
}

const sections: Section[] = [
  { id: 'networth', label: 'Net Worth', desc: 'Assets, liabilities & total wealth over time.', icon: Wallet, chip: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10', ring: 'group-hover:border-emerald-400/50' },
  { id: 'earnings', label: 'Earnings', desc: 'Salary, bonuses & take-home income trends.', icon: TrendingUp, chip: 'text-sky-600 dark:text-sky-400 bg-sky-500/10', ring: 'group-hover:border-sky-400/50' },
  { id: 'budget', label: 'Budget', desc: 'Monthly spending, categories & savings rate.', icon: PiggyBank, chip: 'text-violet-600 dark:text-violet-400 bg-violet-500/10', ring: 'group-hover:border-violet-400/50' },
  { id: 'investments', label: 'Investments', desc: 'Holdings, positions & portfolio performance.', icon: CandlestickChart, chip: 'text-amber-600 dark:text-amber-400 bg-amber-500/10', ring: 'group-hover:border-amber-400/50' },
  { id: 'other-income', label: 'Other Income', desc: 'Courses, royalties, side income & tax.', icon: GraduationCap, chip: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10', ring: 'group-hover:border-indigo-400/50' },
  { id: 'forecast', label: 'Forecast', desc: 'Project future net worth across scenarios.', icon: LineChart, chip: 'text-rose-600 dark:text-rose-400 bg-rose-500/10', ring: 'group-hover:border-rose-400/50' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomeHub({ session, onNavigate }: { session: Session; onNavigate: (id: DashboardId) => void }) {
  const reduce = useReducedMotion()
  const first = session.user?.name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.15 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <CosmicBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
      {/* Hero */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mb-10 md:mb-14"
      >
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{today}</p>
        <h1 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight nw-text-primary">
          {greeting()}, {first}.
        </h1>
        <p className="mt-3 text-base md:text-lg nw-text-secondary max-w-xl">
          All your finances in one place. Pick a space below to jump in.
        </p>
      </motion.div>

      {/* Section cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
      >
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <motion.button
              key={s.id}
              variants={item}
              onClick={() => onNavigate(s.id)}
              whileHover={reduce ? undefined : { y: -4 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`group text-left nw-card p-5 md:p-6 border transition-colors duration-200 ${s.ring} hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/40`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid place-items-center h-11 w-11 rounded-xl ${s.chip} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <ArrowRight className="h-5 w-5 nw-text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
              </div>
              <h2 className="mt-4 text-lg font-semibold nw-text-primary">{s.label}</h2>
              <p className="mt-1 text-sm nw-text-secondary leading-relaxed">{s.desc}</p>
            </motion.button>
          )
        })}
      </motion.div>
      </div>
    </div>
  )
}
