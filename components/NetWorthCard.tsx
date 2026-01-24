'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TrendingUp, TrendingDown, Target, Sparkles, Trophy, Star, Clock, X } from 'lucide-react'

interface NetWorthCardProps {
  netWorth: number
  month: string
  previousNetWorth?: number
}

// Define milestones in INR (starting from 1 Crore)
const MILESTONES = [
  { value: 10000000, label: '1 Crore', emoji: '🏆' },
  { value: 20000000, label: '2 Crore', emoji: '💎' },
  { value: 30000000, label: '3 Crore', emoji: '🚀' },
  { value: 40000000, label: '4 Crore', emoji: '👑' },
  { value: 50000000, label: '5 Crore', emoji: '🔥' },
]

interface HistoricalData {
  month: string
  netWorth: number
}

interface MilestoneInfo {
  milestone: typeof MILESTONES[0]
  achievedMonth: string
  monthsToReach: number
  journeyStart: string
}

const CAREER_START = { month: 8, year: 2021, label: 'Aug 2021' }

const calculateMonthsBetween = (startMonth: number, startYear: number, endMonth: number, endYear: number): number => {
  return (endYear - startYear) * 12 + (endMonth - startMonth)
}

const parseMonth = (monthStr: string): { month: number; year: number } | null => {
  const monthMap: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
  }
  
  const match1 = monthStr.match(/^(\w+)\s+(\d{4})$/i)
  if (match1) {
    const month = monthMap[match1[1].toLowerCase()]
    const year = parseInt(match1[2])
    if (month) return { month, year }
  }
  
  const match2 = monthStr.match(/^(\w+)\/(\d{2})$/i)
  if (match2) {
    const month = monthMap[match2[1].toLowerCase()]
    const year = 2000 + parseInt(match2[2])
    if (month) return { month, year }
  }
  
  return null
}

// Celebration Modal Component - Renders via Portal
function CelebrationModal({ 
  milestone, 
  nextMilestone, 
  milestoneInfo, 
  amountToNext, 
  onClose,
  formatShort 
}: { 
  milestone: typeof MILESTONES[0]
  nextMilestone?: typeof MILESTONES[0]
  milestoneInfo?: MilestoneInfo
  amountToNext: number
  onClose: () => void
  formatShort: (n: number) => string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  if (!mounted) return null

  const modalContent = (
    <div 
      className="celebration-modal-overlay"
      onClick={onClose}
    >
      {/* Floating Stars Background */}
      <div className="celebration-stars">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="celebration-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: `${10 + Math.random() * 20}px`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Confetti Rain */}
      <div className="celebration-confetti">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 7)],
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div 
        className="celebration-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>

        <div className="celebration-trophy">
          <Trophy className="w-16 h-16 text-yellow-400" />
        </div>

        <div className="flex justify-center gap-3 mb-2">
          <span className="text-3xl celebration-bounce" style={{ animationDelay: '0s' }}>🎊</span>
          <span className="text-3xl celebration-bounce" style={{ animationDelay: '0.1s' }}>🏆</span>
          <span className="text-3xl celebration-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
        </div>

        <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Congratulations!
        </h2>

        <p className="text-gray-300 text-lg mb-2">You've reached</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-5xl">{milestone.emoji}</span>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-black text-white">
              {milestone.label.split(' ')[0]}
            </div>
            <div className="text-2xl font-bold text-gray-300">
              {milestone.label.split(' ')[1]}
            </div>
          </div>
          <span className="text-5xl">{milestone.emoji}</span>
        </div>
        <p className="text-gray-400 text-lg mb-6">Net Worth Milestone!</p>

        {milestoneInfo && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl p-4 mb-4 border border-emerald-500/30">
            <p className="text-emerald-300 font-semibold">
              🚀 Journey: {milestoneInfo.journeyStart} → {milestoneInfo.achievedMonth}
            </p>
            <p className="text-emerald-400/80 text-sm mt-1">
              {(() => {
                const years = Math.floor(milestoneInfo.monthsToReach / 12)
                const months = milestoneInfo.monthsToReach % 12
                if (years > 0 && months > 0) return `Achieved in ${years} years ${months} months`
                if (years > 0) return `Achieved in ${years} years`
                return `Achieved in ${months} months`
              })()}
            </p>
          </div>
        )}

        {nextMilestone && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 mb-6 border border-blue-500/30">
            <p className="text-blue-300 font-semibold">
              Next Target: {nextMilestone.label} {nextMilestone.emoji}
            </p>
            <p className="text-blue-400/80 text-sm mt-1">
              {formatShort(amountToNext)} to go! Keep going! 💪
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white font-bold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:scale-105 transition-all"
        >
          Thanks! 🙏
        </button>

        <p className="text-gray-500 text-xs mt-4">Click anywhere to close</p>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// LocalStorage keys for tracking celebrated milestones
const CELEBRATED_MILESTONE_KEY = 'net-worth-celebrated-milestone'
const MILESTONE_ACHIEVED_DATE_KEY = 'net-worth-milestone-achieved-date'
const CELEBRATION_DURATION_MS = 60000
const CELEBRATION_PERIOD_DAYS = 30

export function NetWorthCard({ netWorth, month }: NetWorthCardProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [milestoneTimelines, setMilestoneTimelines] = useState<MilestoneInfo[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  
  const isPositive = netWorth >= 0
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(netWorth))

  const currentMilestone = MILESTONES.filter(m => netWorth >= m.value).pop()
  const nextMilestone = MILESTONES.find(m => netWorth < m.value)
  
  const previousMilestoneValue = currentMilestone?.value || 0
  const nextMilestoneValue = nextMilestone?.value || MILESTONES[MILESTONES.length - 1].value
  const progressToNext = nextMilestone 
    ? ((netWorth - previousMilestoneValue) / (nextMilestoneValue - previousMilestoneValue)) * 100
    : 100
  const amountToNext = nextMilestone ? nextMilestoneValue - netWorth : 0

  const formatShort = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoadingHistory(true)
        const monthsResponse = await fetch('/api/months')
        if (!monthsResponse.ok) throw new Error('Failed to fetch months')
        
        const monthsData = await monthsResponse.json()
        const availableMonths = monthsData.months || []
        const allMonths = [...availableMonths].reverse()
        
        const dataPromises = allMonths.map(async (m: string) => {
          const response = await fetch(`/api/sheets?month=${encodeURIComponent(m)}`)
          if (response.ok) {
            const data = await response.json()
            return { month: m, netWorth: data.netWorth || 0 }
          }
          return { month: m, netWorth: 0 }
        })
        
        const results = await Promise.all(dataPromises)
        setHistoricalData(results)
        calculateMilestoneTimelines(results)
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    
    fetchHistoricalData()
  }, [])

  const calculateMilestoneTimelines = (data: HistoricalData[]) => {
    const timelines: MilestoneInfo[] = []
    let previousMilestoneDate: { month: number; year: number } | null = null
    let previousMilestoneLabel = CAREER_START.label
    
    for (let i = 0; i < MILESTONES.length; i++) {
      const milestone = MILESTONES[i]
      const crossingIndex = data.findIndex(d => d.netWorth >= milestone.value)
      
      if (crossingIndex !== -1) {
        const achievedMonthStr = data[crossingIndex].month
        const achievedDate = parseMonth(achievedMonthStr)
        
        if (achievedDate) {
          let monthsToReach: number
          let journeyStart: string
          
          if (i === 0) {
            monthsToReach = calculateMonthsBetween(
              CAREER_START.month, 
              CAREER_START.year, 
              achievedDate.month, 
              achievedDate.year
            )
            journeyStart = CAREER_START.label
          } else if (previousMilestoneDate) {
            monthsToReach = calculateMonthsBetween(
              previousMilestoneDate.month,
              previousMilestoneDate.year,
              achievedDate.month,
              achievedDate.year
            )
            journeyStart = previousMilestoneLabel
          } else {
            monthsToReach = crossingIndex + 1
            journeyStart = 'Start'
          }
          
          timelines.push({
            milestone,
            achievedMonth: achievedMonthStr,
            monthsToReach: Math.max(1, monthsToReach),
            journeyStart
          })
          
          previousMilestoneDate = achievedDate
          previousMilestoneLabel = achievedMonthStr
        }
      }
    }
    
    setMilestoneTimelines(timelines)
  }

  useEffect(() => {
    if (!currentMilestone) return
    
    const storedMilestoneValue = localStorage.getItem(CELEBRATED_MILESTONE_KEY)
    const storedAchievedDate = localStorage.getItem(MILESTONE_ACHIEVED_DATE_KEY)
    const lastCelebratedValue = storedMilestoneValue ? parseInt(storedMilestoneValue) : 0
    
    const now = new Date()
    
    if (currentMilestone.value > lastCelebratedValue) {
      localStorage.setItem(CELEBRATED_MILESTONE_KEY, currentMilestone.value.toString())
      localStorage.setItem(MILESTONE_ACHIEVED_DATE_KEY, now.toISOString())
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), CELEBRATION_DURATION_MS)
      return () => clearTimeout(timer)
    }
    
    if (currentMilestone.value === lastCelebratedValue && storedAchievedDate) {
      const achievedDate = new Date(storedAchievedDate)
      const daysSinceAchieved = Math.floor((now.getTime() - achievedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceAchieved <= CELEBRATION_PERIOD_DAYS) {
        setShowCelebration(true)
        const timer = setTimeout(() => setShowCelebration(false), CELEBRATION_DURATION_MS)
        return () => clearTimeout(timer)
      }
    }
  }, [currentMilestone])

  return (
    <>
      {showCelebration && currentMilestone && (
        <CelebrationModal
          milestone={currentMilestone}
          nextMilestone={nextMilestone}
          milestoneInfo={milestoneTimelines.find(m => m.milestone.value === currentMilestone.value)}
          amountToNext={amountToNext}
          onClose={() => setShowCelebration(false)}
          formatShort={formatShort}
        />
      )}

      {/* Main Net Worth Card - Full Height with Milestone Journey */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-slate-700/50 hover-lift h-full flex flex-col">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        
        {/* Header Section */}
        <div className="relative p-4 pb-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                isPositive 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30' 
                  : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
              }`}>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 text-white" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Net Worth
                  {currentMilestone && (
                    <span className="text-lg" title={`${currentMilestone.label} achieved!`}>
                      {currentMilestone.emoji}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">{month}</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
              isPositive 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <Star className="h-3 w-3" />
              {isPositive ? 'Positive' : 'Negative'}
            </div>
          </div>
        </div>
        
        {/* Main Amount Section */}
        <div className="relative p-4 pb-3">
          <p className={`text-4xl md:text-5xl font-black tracking-tight ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {!isPositive && '-'}{formattedAmount}
          </p>
          
          {/* Achieved Milestones Row */}
          {currentMilestone && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">Achieved:</span>
              <div className="flex items-center gap-1">
                {MILESTONES.filter(m => netWorth >= m.value).map((m) => (
                  <span 
                    key={m.value} 
                    className="text-lg transform hover:scale-125 transition-transform cursor-default"
                    title={m.label}
                  >
                    {m.emoji}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Progress Section */}
        {nextMilestone && (
          <div className="relative px-4 pb-3">
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-3 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Next: {nextMilestone.label} {nextMilestone.emoji}
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-400">
                  {Math.round(progressToNext)}%
                </span>
              </div>
              
              <div className="w-full bg-slate-700/70 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative"
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-2 text-center">
                {formatShort(amountToNext)} more to go!
              </p>
            </div>
          </div>
        )}
        
        {/* Milestone Timeline - Moved here from Insights */}
        {milestoneTimelines.length > 0 && (
          <div className="relative px-4 pb-4 mt-auto border-t border-slate-700/30 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-slate-300">Milestone Journey</span>
            </div>
            <div className="space-y-2">
              {milestoneTimelines.map((info) => {
                const years = Math.floor(info.monthsToReach / 12)
                const months = info.monthsToReach % 12
                let timeText = ''
                if (years > 0 && months > 0) {
                  timeText = `${years}y ${months}m`
                } else if (years > 0) {
                  timeText = `${years}y`
                } else {
                  timeText = `${months}m`
                }
                
                return (
                  <div key={info.milestone.value} className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/30">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-base">{info.milestone.emoji}</span>
                        <span className="text-sm font-medium text-white">{info.milestone.label}</span>
                      </span>
                      <span className="text-xs font-bold text-amber-400">{info.achievedMonth}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                      <span>From {info.journeyStart}</span>
                      <span className="font-medium text-emerald-400">⏱️ {timeText}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Separate Insights Card Component
interface NetWorthInsightsProps {
  netWorth: number
}

export function NetWorthInsights({ netWorth }: NetWorthInsightsProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [milestoneTimelines, setMilestoneTimelines] = useState<MilestoneInfo[]>([])
  const [loading, setLoading] = useState(true)

  const currentMilestone = MILESTONES.filter(m => netWorth >= m.value).pop()
  const nextMilestone = MILESTONES.find(m => netWorth < m.value)
  const amountToNext = nextMilestone ? nextMilestone.value - netWorth : 0

  const formatShort = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true)
        const monthsResponse = await fetch('/api/months')
        if (!monthsResponse.ok) throw new Error('Failed to fetch months')
        
        const monthsData = await monthsResponse.json()
        const availableMonths = monthsData.months || []
        const allMonths = [...availableMonths].reverse()
        
        const dataPromises = allMonths.map(async (m: string) => {
          const response = await fetch(`/api/sheets?month=${encodeURIComponent(m)}`)
          if (response.ok) {
            const data = await response.json()
            return { month: m, netWorth: data.netWorth || 0 }
          }
          return { month: m, netWorth: 0 }
        })
        
        const results = await Promise.all(dataPromises)
        setHistoricalData(results)
        calculateMilestoneTimelines(results)
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchHistoricalData()
  }, [])

  const calculateMilestoneTimelines = (data: HistoricalData[]) => {
    const timelines: MilestoneInfo[] = []
    let previousMilestoneDate: { month: number; year: number } | null = null
    let previousMilestoneLabel = CAREER_START.label
    
    for (let i = 0; i < MILESTONES.length; i++) {
      const milestone = MILESTONES[i]
      const crossingIndex = data.findIndex(d => d.netWorth >= milestone.value)
      
      if (crossingIndex !== -1) {
        const achievedMonthStr = data[crossingIndex].month
        const achievedDate = parseMonth(achievedMonthStr)
        
        if (achievedDate) {
          let monthsToReach: number
          let journeyStart: string
          
          if (i === 0) {
            monthsToReach = calculateMonthsBetween(
              CAREER_START.month, 
              CAREER_START.year, 
              achievedDate.month, 
              achievedDate.year
            )
            journeyStart = CAREER_START.label
          } else if (previousMilestoneDate) {
            monthsToReach = calculateMonthsBetween(
              previousMilestoneDate.month,
              previousMilestoneDate.year,
              achievedDate.month,
              achievedDate.year
            )
            journeyStart = previousMilestoneLabel
          } else {
            monthsToReach = crossingIndex + 1
            journeyStart = 'Start'
          }
          
          timelines.push({
            milestone,
            achievedMonth: achievedMonthStr,
            monthsToReach: Math.max(1, monthsToReach),
            journeyStart
          })
          
          previousMilestoneDate = achievedDate
          previousMilestoneLabel = achievedMonthStr
        }
      }
    }
    
    setMilestoneTimelines(timelines)
  }

  // Generate insights
  const generateInsights = () => {
    const insights: { icon: string; text: string; highlight?: boolean }[] = []
    
    if (currentMilestone) {
      const milestoneInfo = milestoneTimelines.find(m => m.milestone.value === currentMilestone.value)
      if (milestoneInfo) {
        insights.push({
          icon: currentMilestone.emoji,
          text: `${currentMilestone.label} achieved in ${milestoneInfo.achievedMonth}!`,
          highlight: true
        })
        
        if (milestoneInfo.monthsToReach > 1) {
          const years = Math.floor(milestoneInfo.monthsToReach / 12)
          const months = milestoneInfo.monthsToReach % 12
          let journeyText = ''
          if (years > 0 && months > 0) {
            journeyText = `${years}y ${months}m journey`
          } else if (years > 0) {
            journeyText = `${years} year journey`
          } else {
            journeyText = `${months} month journey`
          }
          insights.push({
            icon: '⏱️',
            text: `Journey to ${currentMilestone.label}: ${journeyText}`
          })
        }
      }
    }

    if (nextMilestone) {
      insights.push({
        icon: '🎯',
        text: `${formatShort(amountToNext)} away from ${nextMilestone.label}`
      })
      
      if (historicalData.length >= 3) {
        const recent = historicalData.slice(-3)
        const avgMonthlyGrowth = (recent[recent.length - 1].netWorth - recent[0].netWorth) / (recent.length - 1)
        
        if (avgMonthlyGrowth > 0) {
          const monthsToNext = Math.ceil(amountToNext / avgMonthlyGrowth)
          if (monthsToNext <= 36) {
            const years = Math.floor(monthsToNext / 12)
            const months = monthsToNext % 12
            let etaText = ''
            if (years > 0 && months > 0) {
              etaText = `~${years}y ${months}m`
            } else if (years > 0) {
              etaText = `~${years} years`
            } else {
              etaText = `~${months} months`
            }
            insights.push({
              icon: '📈',
              text: `ETA to ${nextMilestone.label}: ${etaText}`
            })
          }
        }
      }
    }

    if (netWorth >= 10000000) {
      insights.push({ icon: '👑', text: 'Crorepati Club Member!' })
    }

    if (historicalData.length >= 2) {
      const lastMonth = historicalData[historicalData.length - 1]
      const prevMonth = historicalData[historicalData.length - 2]
      const growth = lastMonth.netWorth - prevMonth.netWorth
      if (growth !== 0) {
        const emoji = growth > 0 ? '📊' : '📉'
        const direction = growth > 0 ? '+' : ''
        insights.push({
          icon: emoji,
          text: `This month: ${direction}${formatShort(growth)}`
        })
      }
    }

    return insights.slice(0, 5)
  }

  const insights = generateInsights()

  if (loading) {
    return (
      <div className="glass-dark rounded-2xl p-5 glow-amber animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-slate-700/50 rounded"></div>
          <div className="h-10 bg-slate-700/50 rounded"></div>
          <div className="h-10 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-dark rounded-2xl p-5 glow-amber h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">Wealth Insights</h3>
      </div>

      {/* Insights List */}
      {insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                insight.highlight 
                  ? 'bg-gradient-to-r from-emerald-900/40 to-green-900/30 border border-emerald-500/30' 
                  : 'bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30'
              }`}
            >
              <span className="text-xl">{insight.icon}</span>
              <span className={`text-sm ${insight.highlight ? 'text-emerald-300 font-semibold' : 'text-slate-300'}`}>
                {insight.text}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm">Loading insights...</p>
        </div>
      )}

    </div>
  )
}
