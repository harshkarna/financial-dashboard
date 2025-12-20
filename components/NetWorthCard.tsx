'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Sparkles, Trophy, Star, Clock, Calendar } from 'lucide-react'

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
  journeyStart: string // Where the journey started from
}

// Career/Earning start date - this is when the wealth building journey began
const CAREER_START = { month: 8, year: 2021, label: 'Aug 2021' } // August 2021

// Helper to calculate months between two dates
const calculateMonthsBetween = (startMonth: number, startYear: number, endMonth: number, endYear: number): number => {
  return (endYear - startYear) * 12 + (endMonth - startMonth)
}

// Helper to parse month string like "Aug 2025" or "Aug/25" to { month, year }
const parseMonth = (monthStr: string): { month: number; year: number } | null => {
  const monthMap: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
  }
  
  // Try format "Aug 2025"
  const match1 = monthStr.match(/^(\w+)\s+(\d{4})$/i)
  if (match1) {
    const month = monthMap[match1[1].toLowerCase()]
    const year = parseInt(match1[2])
    if (month) return { month, year }
  }
  
  // Try format "Aug/25"
  const match2 = monthStr.match(/^(\w+)\/(\d{2})$/i)
  if (match2) {
    const month = monthMap[match2[1].toLowerCase()]
    const year = 2000 + parseInt(match2[2])
    if (month) return { month, year }
  }
  
  return null
}

// Balloon component with floating animation
const Balloon = ({ delay, fromTop }: { delay: number; fromTop: boolean }) => {
  const colors = [
    'linear-gradient(180deg, #FF6B6B 0%, #CC5555 100%)', // Red
    'linear-gradient(180deg, #4ECDC4 0%, #3AA89E 100%)', // Teal
    'linear-gradient(180deg, #FFE66D 0%, #F4D35E 100%)', // Yellow
    'linear-gradient(180deg, #95E1D3 0%, #7BC8BB 100%)', // Mint
    'linear-gradient(180deg, #F38181 0%, #D96666 100%)', // Coral
    'linear-gradient(180deg, #AA96DA 0%, #8A76BA 100%)', // Purple
    'linear-gradient(180deg, #FCBAD3 0%, #E9A0BE 100%)', // Pink
    'linear-gradient(180deg, #A8D8EA 0%, #8CC5D8 100%)', // Sky blue
  ]
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const randomX = 5 + Math.random() * 90
  const randomSize = 40 + Math.random() * 25
  const randomDuration = 3 + Math.random() * 2

  return (
    <div
      className={`absolute pointer-events-none ${fromTop ? 'animate-balloon-drop' : 'animate-balloon-rise'}`}
      style={{
        left: `${randomX}%`,
        top: fromTop ? '-100px' : '100%',
        animationDelay: `${delay}ms`,
        animationDuration: `${randomDuration}s`,
      }}
    >
      {/* Balloon body */}
      <div
        className="relative"
        style={{
          width: `${randomSize}px`,
          height: `${randomSize * 1.2}px`,
          background: randomColor,
          borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
          boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.1), inset 10px 10px 20px rgba(255,255,255,0.3)',
        }}
      >
        {/* Balloon shine */}
        <div
          className="absolute"
          style={{
            width: '30%',
            height: '30%',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '50%',
            top: '15%',
            left: '20%',
          }}
        />
        {/* Balloon knot */}
        <div
          className="absolute"
          style={{
            width: '8px',
            height: '8px',
            background: 'inherit',
            borderRadius: '50%',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
      {/* Balloon string */}
      <div
        className="mx-auto"
        style={{
          width: '1px',
          height: `${randomSize * 0.8}px`,
          background: 'rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}

// Confetti particle component
const Confetti = ({ delay }: { delay: number }) => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const randomX = Math.random() * 100
  const randomRotation = Math.random() * 360
  const randomSize = 8 + Math.random() * 12

  return (
    <div
      className="absolute animate-confetti pointer-events-none"
      style={{
        left: `${randomX}%`,
        top: '-10px',
        animationDelay: `${delay}ms`,
        transform: `rotate(${randomRotation}deg)`,
      }}
    >
      <div
        style={{
          width: `${randomSize}px`,
          height: `${randomSize}px`,
          backgroundColor: randomColor,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        }}
      />
    </div>
  )
}

// Sparkle component
const Sparkle = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 100
  const randomY = Math.random() * 100
  
  return (
    <div
      className="absolute animate-sparkle pointer-events-none text-2xl"
      style={{
        left: `${randomX}%`,
        top: `${randomY}%`,
        animationDelay: `${delay}ms`,
      }}
    >
      ✨
    </div>
  )
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
      {/* Full Screen Celebration Popup */}
      {showCelebration && currentMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowCelebration(false)}
          />
          
          {/* Balloons from top */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <Balloon key={`top-${i}`} delay={i * 150} fromTop={true} />
            ))}
          </div>
          
          {/* Balloons from bottom */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <Balloon key={`bottom-${i}`} delay={i * 200 + 500} fromTop={false} />
            ))}
          </div>
          
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 80 }).map((_, i) => (
              <Confetti key={i} delay={i * 50} />
            ))}
          </div>
          
          {/* Sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <Sparkle key={i} delay={i * 200} />
            ))}
          </div>
          
          {/* Celebration Card */}
          <div className="relative z-10 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-1 shadow-2xl animate-celebration-pop mx-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 text-center">
              {/* Trophy Icon */}
              <div className="mb-6 animate-bounce-slow">
                <div className="inline-block p-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg">
                  <Trophy className="h-16 w-16 text-white" />
                </div>
              </div>
              
              {/* Congratulations Text */}
              <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 mb-4">
                🎉 Congratulations! 🎉
              </h2>
              
              {/* Milestone Achievement */}
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">You've reached</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl">{currentMilestone.emoji}</span>
                  <span className="text-4xl md:text-5xl font-black text-gray-800 dark:text-white">
                    {currentMilestone.label}
                  </span>
                  <span className="text-5xl">{currentMilestone.emoji}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Net Worth Milestone!</p>
              </div>
              
              {/* Milestone Info */}
              {milestoneTimelines.find(m => m.milestone.value === currentMilestone.value) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 mb-6">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    🚀 Journey: {milestoneTimelines.find(m => m.milestone.value === currentMilestone.value)?.journeyStart} → {milestoneTimelines.find(m => m.milestone.value === currentMilestone.value)?.achievedMonth}
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    {(() => {
                      const info = milestoneTimelines.find(m => m.milestone.value === currentMilestone.value)
                      if (!info) return ''
                      const years = Math.floor(info.monthsToReach / 12)
                      const months = info.monthsToReach % 12
                      if (years > 0 && months > 0) return `Achieved in ${years} years ${months} months`
                      if (years > 0) return `Achieved in ${years} years`
                      return `Achieved in ${months} months`
                    })()}
                  </p>
                </div>
              )}
              
              {/* Next Milestone Teaser */}
              {nextMilestone && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 mb-6">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">
                    Next Target: {nextMilestone.label} {nextMilestone.emoji}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                    {formatShort(amountToNext)} to go! Keep going! 💪
                  </p>
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={() => setShowCelebration(false)}
                className="mt-2 px-8 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Thanks! 🙏
              </button>
              
              <p className="text-xs text-gray-400 mt-4">Click anywhere to close</p>
            </div>
          </div>
        </div>
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

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 4s ease-out forwards;
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes balloon-drop {
          0% {
            transform: translateY(0) rotate(-5deg);
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(5deg);
          }
          100% {
            transform: translateY(120vh) rotate(-5deg);
            opacity: 0.7;
          }
        }
        .animate-balloon-drop {
          animation: balloon-drop 5s ease-in-out forwards;
        }
        @keyframes balloon-rise {
          0% {
            transform: translateY(0) rotate(5deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-50vh) rotate(-5deg);
          }
          100% {
            transform: translateY(-120vh) rotate(5deg);
            opacity: 0.7;
          }
        }
        .animate-balloon-rise {
          animation: balloon-rise 6s ease-in-out forwards;
        }
        @keyframes sparkle {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes celebration-pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-celebration-pop {
          animation: celebration-pop 0.5s ease-out forwards;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
      </div>
    </>
  )
}
