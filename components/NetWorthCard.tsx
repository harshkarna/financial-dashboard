'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TrendingUp, TrendingDown, Target, Sparkles, Trophy, Star, Clock, Calendar, X } from 'lucide-react'

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
    // Prevent body scroll when modal is open
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>

        {/* Trophy */}
        <div className="celebration-trophy">
          <Trophy className="w-16 h-16 text-yellow-400" />
        </div>

        {/* Decorative Icons */}
        <div className="flex justify-center gap-3 mb-2">
          <span className="text-3xl celebration-bounce" style={{ animationDelay: '0s' }}>🎊</span>
          <span className="text-3xl celebration-bounce" style={{ animationDelay: '0.1s' }}>🏆</span>
          <span className="text-3xl celebration-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Congratulations!
        </h2>

        {/* Achievement */}
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

        {/* Journey Info */}
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

        {/* Next Target */}
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

        {/* Close Button */}
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
const CELEBRATION_DURATION_MS = 60000 // 1 minute (60 seconds)
const CELEBRATION_PERIOD_DAYS = 30 // Show celebration for 30 days after milestone

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

  // Find current and next milestone
  const currentMilestone = MILESTONES.filter(m => netWorth >= m.value).pop()
  const nextMilestone = MILESTONES.find(m => netWorth < m.value)
  
  // Calculate progress to next milestone
  const previousMilestoneValue = currentMilestone?.value || 0
  const nextMilestoneValue = nextMilestone?.value || MILESTONES[MILESTONES.length - 1].value
  const progressToNext = nextMilestone 
    ? ((netWorth - previousMilestoneValue) / (nextMilestoneValue - previousMilestoneValue)) * 100
    : 100
  const amountToNext = nextMilestone ? nextMilestoneValue - netWorth : 0

  // Format large numbers
  const formatShort = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
    return `₹${amount}`
  }

  // Fetch historical data for milestone timeline calculation
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoadingHistory(true)
        
        // Get all available months
        const monthsResponse = await fetch('/api/months')
        if (!monthsResponse.ok) throw new Error('Failed to fetch months')
        
        const monthsData = await monthsResponse.json()
        const availableMonths = monthsData.months || []
        
        // Fetch net worth for all months (reversed to get chronological order)
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
        
        // Calculate milestone timelines
        calculateMilestoneTimelines(results)
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    
    fetchHistoricalData()
  }, [])

  // Calculate when each milestone was reached
  const calculateMilestoneTimelines = (data: HistoricalData[]) => {
    const timelines: MilestoneInfo[] = []
    let previousMilestoneDate: { month: number; year: number } | null = null
    let previousMilestoneLabel = CAREER_START.label
    
    for (let i = 0; i < MILESTONES.length; i++) {
      const milestone = MILESTONES[i]
      
      // Find first month where net worth crossed milestone
      const crossingIndex = data.findIndex(d => d.netWorth >= milestone.value)
      
      if (crossingIndex !== -1) {
        const achievedMonthStr = data[crossingIndex].month
        const achievedDate = parseMonth(achievedMonthStr)
        
        if (achievedDate) {
          let monthsToReach: number
          let journeyStart: string
          
          if (i === 0) {
            // First milestone (1 Crore): Calculate from career start
            monthsToReach = calculateMonthsBetween(
              CAREER_START.month, 
              CAREER_START.year, 
              achievedDate.month, 
              achievedDate.year
            )
            journeyStart = CAREER_START.label
          } else if (previousMilestoneDate) {
            // Subsequent milestones: Calculate from previous milestone
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
            monthsToReach: Math.max(1, monthsToReach), // At least 1 month
            journeyStart
          })
          
          // Update for next milestone
          previousMilestoneDate = achievedDate
          previousMilestoneLabel = achievedMonthStr
        }
      }
    }
    
    setMilestoneTimelines(timelines)
  }

  // Trigger celebration for 1 month after reaching a milestone
  useEffect(() => {
    if (!currentMilestone) return
    
    // Get stored milestone data
    const storedMilestoneValue = localStorage.getItem(CELEBRATED_MILESTONE_KEY)
    const storedAchievedDate = localStorage.getItem(MILESTONE_ACHIEVED_DATE_KEY)
    const lastCelebratedValue = storedMilestoneValue ? parseInt(storedMilestoneValue) : 0
    
    const now = new Date()
    
    // Check if this is a NEW milestone (higher than last celebrated)
    if (currentMilestone.value > lastCelebratedValue) {
      // New milestone reached! Save milestone and current date
      localStorage.setItem(CELEBRATED_MILESTONE_KEY, currentMilestone.value.toString())
      localStorage.setItem(MILESTONE_ACHIEVED_DATE_KEY, now.toISOString())
      
      // Show celebration
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), CELEBRATION_DURATION_MS)
      return () => clearTimeout(timer)
    }
    
    // Check if we're still within the celebration period (30 days)
    if (currentMilestone.value === lastCelebratedValue && storedAchievedDate) {
      const achievedDate = new Date(storedAchievedDate)
      const daysSinceAchieved = Math.floor((now.getTime() - achievedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceAchieved <= CELEBRATION_PERIOD_DAYS) {
        // Still within celebration period - show celebration for 1 minute
        setShowCelebration(true)
        const timer = setTimeout(() => setShowCelebration(false), CELEBRATION_DURATION_MS)
        return () => clearTimeout(timer)
      }
    }
  }, [currentMilestone])

  // Generate insights including milestone timelines
  const generateInsights = () => {
    const insights: { icon: string; text: string; highlight?: boolean }[] = []
    
    // Milestone achievement with timeline
    if (currentMilestone) {
      const milestoneInfo = milestoneTimelines.find(m => m.milestone.value === currentMilestone.value)
      if (milestoneInfo) {
        insights.push({
          icon: currentMilestone.emoji,
          text: `${currentMilestone.label} achieved in ${milestoneInfo.achievedMonth}!`,
          highlight: true
        })
        
        // Add journey time
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

    // Progress to next milestone
    if (nextMilestone) {
      insights.push({
        icon: '🎯',
        text: `${formatShort(amountToNext)} away from ${nextMilestone.label}`
      })
      
      // Estimate time to next milestone based on recent growth
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

    // Net worth tier insight
    if (netWorth >= 10000000) {
      insights.push({ icon: '👑', text: 'Crorepati Club Member!' })
    }

    // Monthly growth insight
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

    return insights.slice(0, 4)
  }

  const insights = generateInsights()

  return (
    <>
      {/* Celebration Modal - Uses Portal to render at document root */}
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

      <div className="relative bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-6 border border-green-100 dark:border-gray-600 transition-colors duration-200 overflow-hidden">
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              Net Worth
              {currentMilestone && (
                <span className="text-2xl" title={`${currentMilestone.label} achieved!`}>
                  {currentMilestone.emoji}
                </span>
              )}
            </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current financial position</p>
        </div>
        <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>
      
        {/* Net Worth Amount */}
      <div className="space-y-3">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{month}</p>
          <p className={`text-4xl font-bold ${
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {!isPositive && '-'}{formattedAmount}
          </p>
        </div>
      </div>
      
        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Next: {nextMilestone.label} {nextMilestone.emoji}
                </span>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {Math.round(progressToNext)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              {formatShort(amountToNext)} more to go!
            </p>
          </div>
        )}

        {/* Milestone Timeline */}
        {milestoneTimelines.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestone Journey</span>
            </div>
            <div className="space-y-2">
              {milestoneTimelines.map((info, idx) => {
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
                  <div key={idx} className="bg-white/50 dark:bg-gray-700/50 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-lg">{info.milestone.emoji}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{info.milestone.label}</span>
                      </span>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{info.achievedMonth}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>From {info.journeyStart}</span>
                      <span className="font-medium text-green-600 dark:text-green-400">⏱️ {timeText}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              Insights
            </div>
            <div className="space-y-1">
              {insights.map((insight, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 rounded-md px-2 py-1 ${
                    insight.highlight 
                      ? 'bg-green-100/70 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-white/50 dark:bg-gray-700/50'
                  }`}
                >
                  <span>{insight.icon}</span>
                  <span>{insight.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-IN')}
          </p>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
              {currentMilestone && <Star className="h-3 w-3" />}
            {isPositive ? 'Positive' : 'Negative'}
            </div>
          </div>
        </div>
      </div>

</div>
    </>
  )
}
