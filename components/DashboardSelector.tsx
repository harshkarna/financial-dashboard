'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Session } from 'next-auth'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  CandlestickChart,
  GraduationCap,
  LineChart,
  CircleDollarSign,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'

export type DashboardId = 'home' | 'networth' | 'earnings' | 'budget' | 'investments' | 'other-income' | 'forecast'

interface DashboardSelectorProps {
  selectedDashboard: DashboardId
  onDashboardChange: (dashboard: DashboardId) => void
  session: Session
  onSignOut: () => void
}

const dashboards = [
  { id: 'networth' as const, label: 'Net Worth', shortLabel: 'Worth', icon: Wallet },
  { id: 'earnings' as const, label: 'Earnings', shortLabel: 'Earnings', icon: TrendingUp },
  { id: 'budget' as const, label: 'Budget', shortLabel: 'Budget', icon: PiggyBank },
  { id: 'investments' as const, label: 'Investments', shortLabel: 'Invest', icon: CandlestickChart },
  { id: 'other-income' as const, label: 'Other Income', shortLabel: 'Income', icon: GraduationCap },
  { id: 'forecast' as const, label: 'Forecast', shortLabel: 'Forecast', icon: LineChart },
]

export function DashboardSelector({
  selectedDashboard,
  onDashboardChange,
  session,
  onSignOut,
}: DashboardSelectorProps) {
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Sliding active-tab indicator (desktop) --------------------------------
  const navRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  const measure = useCallback(() => {
    const nav = navRef.current
    const btn = btnRefs.current[selectedDashboard]
    if (!nav) return
    if (!btn) {
      // e.g. on the Home hub — no tab is active, so hide the pill.
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }
    const navRect = nav.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    if (btnRect.width === 0) return
    setIndicator({ left: btnRect.left - navRect.left, width: btnRect.width, ready: true })
  }, [selectedDashboard])

  useLayoutEffect(() => {
    measure()
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [measure])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    // Re-measure once webfonts settle (label widths shift).
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(measure)
    }
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Desktop header */}
      <header
        className={`hidden md:block sticky top-0 z-40 w-full border-b transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? 'border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-[#0f131a]/85 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.15)]'
            : 'border-transparent bg-white/60 dark:bg-[#0f131a]/60 backdrop-blur-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Brand onClick={() => onDashboardChange('home')} active={selectedDashboard === 'home'} />

            {/* Navigation */}
            <nav aria-label="Dashboards">
              <div
                ref={navRef}
                className="relative flex items-center gap-0.5 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.03] p-1"
              >
                <span
                  aria-hidden
                  className="absolute top-1 bottom-1 rounded-xl bg-white dark:bg-white/[0.08] shadow-sm ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] transition-[left,width,opacity] duration-300 ease-out"
                  style={{ left: indicator.left, width: indicator.width, opacity: indicator.ready ? 1 : 0 }}
                />
                {dashboards.map((d) => {
                  const Icon = d.icon
                  const active = selectedDashboard === d.id
                  return (
                    <button
                      key={d.id}
                      ref={(el) => {
                        btnRefs.current[d.id] = el
                      }}
                      onClick={() => onDashboardChange(d.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative z-10 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors duration-200 active:scale-[0.97] ${
                        active
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 transition-transform duration-200 ${
                          active ? 'scale-110' : 'group-hover:scale-110 group-hover:-translate-y-0.5'
                        }`}
                      />
                      <span>{d.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <img
                    src={session.user?.image || ''}
                    alt={session.user?.name || ''}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-900/5 dark:ring-white/10"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {session.user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-60 nw-card !rounded-2xl p-1.5 z-50 animate-scale-in origin-top-right">
                      <div className="px-3 py-2.5">
                        <p className="text-sm font-semibold nw-text-primary truncate">{session.user?.name}</p>
                        <p className="text-xs nw-text-muted truncate">{session.user?.email}</p>
                      </div>
                      <div className="h-px my-1 nw-hairline border-t" />
                      <button
                        onClick={onSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-white/10 bg-white/85 dark:bg-[#0f131a]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          <Brand compact onClick={() => onDashboardChange('home')} active={selectedDashboard === 'home'} />
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
            <button
              onClick={() => setShowMobileMenu(true)}
              aria-label="Open menu"
              className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-[#0f131a]/90 backdrop-blur-xl">
        <div className="flex items-stretch justify-around px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {dashboards.map((d) => {
            const Icon = d.icon
            const active = selectedDashboard === d.id
            return (
              <button
                key={d.id}
                onClick={() => onDashboardChange(d.id)}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center flex-1 gap-1 py-1.5 rounded-xl active:scale-95 transition-transform"
              >
                <span
                  aria-hidden
                  className={`absolute top-0 h-0.5 w-6 rounded-full bg-indigo-500 dark:bg-indigo-400 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
                />
                <span
                  className={`grid place-items-center h-8 w-10 rounded-lg transition-all duration-300 ${
                    active ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
                </span>
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>
                  {d.shortLabel}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-[#0f131a] border-l border-slate-200/60 dark:border-white/10 shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
              <Brand compact />
              <button
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close menu"
                className="grid place-items-center w-8 h-8 rounded-lg border border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={session.user?.image || ''}
                  alt={session.user?.name || ''}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-900/5 dark:ring-white/10"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold nw-text-primary truncate">{session.user?.name}</p>
                  <p className="text-sm nw-text-muted truncate">{session.user?.email}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <button
                onClick={() => {
                  setShowMobileMenu(false)
                  onSignOut()
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile nav */}
      <div className="md:hidden h-[4.75rem]" />

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </>
  )
}

function Brand({ compact = false, onClick, active = false }: { compact?: boolean; onClick?: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go to home"
      className="group flex items-center gap-2.5 select-none rounded-xl -ml-1 pl-1 pr-1.5 py-1 hover:bg-slate-100 dark:hover:bg-white/[0.05] active:scale-[0.98] transition-all"
    >
      <div className={`relative grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105 ${active ? 'ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-transparent' : ''}`}>
        <CircleDollarSign className="w-[18px] h-[18px] text-white" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0f131a]" />
        </span>
      </div>
      {!compact ? (
        <div className="leading-tight text-left">
          <h1 className="text-[15px] font-bold nw-text-primary tracking-tight">Financial Hub</h1>
          <p className="text-[11px] nw-text-muted -mt-0.5">Personal finance</p>
        </div>
      ) : (
        <span className="font-bold nw-text-primary tracking-tight">Financial Hub</span>
      )}
    </button>
  )
}

function ThemeToggle({ theme, onToggle, compact = false }: { theme: string; onToggle: () => void; compact?: boolean }) {
  const size = compact ? 'w-9 h-9' : 'w-9 h-9'
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={`relative grid place-items-center ${size} rounded-xl border border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all overflow-hidden`}
    >
      <Sun
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}
      />
      <Moon
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${theme === 'light' ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'}`}
      />
    </button>
  )
}
