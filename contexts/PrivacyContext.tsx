'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { MASK } from '@/lib/format'

interface PrivacyContextType {
  /** When true, monetary values are masked. */
  hidden: boolean
  toggle: () => void
  /** Wrap a formatted money string; returns a mask when hidden. */
  mask: (formatted: string) => string
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

const STORAGE_KEY = 'net-worth-privacy-hidden'

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(STORAGE_KEY) === 'true')
    } catch {
      /* localStorage unavailable — default to visible */
    }
  }, [])

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        /* ignore persistence errors */
      }
      return next
    })
  }, [])

  const mask = useCallback((formatted: string) => (hidden ? MASK : formatted), [hidden])

  return (
    <PrivacyContext.Provider value={{ hidden, toggle, mask }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy(): PrivacyContextType {
  const ctx = useContext(PrivacyContext)
  if (!ctx) {
    // Graceful fallback so components can be used outside the provider.
    return { hidden: false, toggle: () => {}, mask: (f: string) => f }
  }
  return ctx
}
