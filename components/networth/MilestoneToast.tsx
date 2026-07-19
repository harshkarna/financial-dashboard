'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PartyPopper, X } from 'lucide-react'
import { currentMilestone } from '@/lib/netWorth'

const CELEBRATED_KEY = 'net-worth-celebrated-milestone'

interface MilestoneToastProps {
  netWorth: number
}

/**
 * Subtle, once-only celebration. Shows a small dismissible toast the first
 * time a new milestone is crossed, then never again for that milestone.
 */
export function MilestoneToast({ netWorth }: MilestoneToastProps) {
  const [mounted, setMounted] = useState(false)
  const [milestone, setMilestone] = useState<ReturnType<typeof currentMilestone>>(undefined)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const cur = currentMilestone(netWorth)
    if (!cur) return
    let lastCelebrated = 0
    try {
      lastCelebrated = parseInt(localStorage.getItem(CELEBRATED_KEY) || '0', 10)
    } catch {
      /* ignore */
    }
    if (cur.value > lastCelebrated) {
      setMilestone(cur)
      try {
        localStorage.setItem(CELEBRATED_KEY, String(cur.value))
      } catch {
        /* ignore */
      }
      const timer = setTimeout(() => setMilestone(undefined), 8000)
      return () => clearTimeout(timer)
    }
  }, [netWorth])

  if (!mounted || !milestone) return null

  return createPortal(
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 nw-rise"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <div className="nw-card flex items-center gap-3 p-4 pr-3 shadow-xl">
        <span className="grid place-items-center h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <PartyPopper className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold nw-text-primary">Milestone reached</p>
          <p className="text-xs nw-text-secondary">You crossed {milestone.label} in net worth.</p>
        </div>
        <button
          onClick={() => setMilestone(undefined)}
          aria-label="Dismiss"
          className="ml-1 shrink-0 rounded-md p-1.5 nw-control"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
