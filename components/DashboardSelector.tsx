'use client'

import { useState } from 'react'
import { Session } from 'next-auth'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  TrendingUp, 
  Wallet, 
  PieChart, 
  CreditCard, 
  Moon, 
  Sun, 
  LogOut, 
  User,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'

interface DashboardSelectorProps {
  selectedDashboard: 'networth' | 'earnings' | 'budget'
  onDashboardChange: (dashboard: 'networth' | 'earnings' | 'budget') => void
  session: Session
  onSignOut: () => void
}

const dashboards = [
  { 
    id: 'networth' as const, 
    label: 'Net Worth', 
    shortLabel: 'Worth',
    icon: Wallet, 
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    activeColor: 'text-emerald-600 dark:text-emerald-400'
  },
  { 
    id: 'earnings' as const, 
    label: 'Earnings', 
    shortLabel: 'Earnings',
    icon: TrendingUp, 
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-500/10',
    activeColor: 'text-blue-600 dark:text-blue-400'
  },
  { 
    id: 'budget' as const, 
    label: 'Budget', 
    shortLabel: 'Budget',
    icon: CreditCard, 
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    activeColor: 'text-purple-600 dark:text-purple-400'
  },
]

export function DashboardSelector({ 
  selectedDashboard, 
  onDashboardChange, 
  session, 
  onSignOut 
}: DashboardSelectorProps) {
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const selectedDashboardInfo = dashboards.find(d => d.id === selectedDashboard)

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 w-full">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-50"></div>
                  <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Financial Hub
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">Personal Dashboard</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex items-center">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 gap-1">
                  {dashboards.map((dashboard) => {
                    const Icon = dashboard.icon
                    const isActive = selectedDashboard === dashboard.id
                    return (
                      <button
                        key={dashboard.id}
                        onClick={() => onDashboardChange(dashboard.id)}
                        className={`
                          relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                          transition-all duration-300 ease-out
                          ${isActive 
                            ? 'bg-white dark:bg-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50' 
                            : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? dashboard.activeColor : 'text-gray-500 dark:text-gray-400'}`} />
                        <span className={`transition-colors ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {dashboard.label}
                        </span>
                        {isActive && (
                          <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r ${dashboard.color}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </nav>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <img
                      src={session.user?.image || ''}
                      alt={session.user?.name || ''}
                      className="w-7 h-7 rounded-lg object-cover ring-2 ring-white dark:ring-gray-700"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                      {session.user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 py-2 z-50 animate-scale-in">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{session.user?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                        </div>
                        <button
                          onClick={onSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 w-full">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <PieChart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Financial Hub</span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon
            const isActive = selectedDashboard === dashboard.id
            return (
              <button
                key={dashboard.id}
                onClick={() => onDashboardChange(dashboard.id)}
                className={`
                  flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-2xl mx-1
                  transition-all duration-300 ease-out
                  ${isActive ? dashboard.bgColor : ''}
                `}
              >
                <div className={`
                  relative flex items-center justify-center w-10 h-10 rounded-xl mb-0.5
                  transition-all duration-300
                  ${isActive ? `bg-gradient-to-r ${dashboard.color} shadow-lg` : ''}
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <span className={`
                  text-xs font-medium transition-colors
                  ${isActive ? dashboard.activeColor : 'text-gray-400 dark:text-gray-500'}
                `}>
                  {dashboard.shortLabel}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* User Info */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src={session.user?.image || ''}
                  alt={session.user?.name || ''}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{session.user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="p-4">
              <button
                onClick={() => {
                  setShowMobileMenu(false)
                  onSignOut()
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add padding at bottom for mobile nav */}
      <div className="md:hidden h-20" />

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </>
  )
}
