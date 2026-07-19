'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

interface Star {
  x: number
  y: number
  r: number
  baseA: number
  tw: number
  phase: number
  vx: number
  vy: number
}

interface Shooting {
  x: number
  y: number
  vx: number
  vy: number
  len: number
  life: number
  maxLife: number
}

/**
 * A live, cosmic backdrop: a drifting + twinkling canvas starfield with
 * occasional shooting stars, layered under slow nebula glows.
 * Theme-aware and fully static under prefers-reduced-motion.
 */
export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDark = theme === 'dark'
    const starRGB = isDark ? '226,232,255' : '99,102,241'
    const shootRGB = isDark ? '190,210,255' : '129,140,248'

    let w = 0
    let h = 0
    let dpr = 1
    let stars: Star[] = []
    let shooting: Shooting | null = null
    let nextShootIn = 120
    let raf = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const seed = () => {
      const count = Math.min(300, Math.max(90, Math.round((w * h) / 6200)))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.4,
        baseA: (isDark ? 0.7 : 0.4) * (Math.random() * 0.7 + 0.35),
        tw: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.05,
        vy: Math.random() * 0.06 + 0.02,
      }))
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        ctx.beginPath()
        ctx.fillStyle = `rgba(${starRGB},${s.baseA})`
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let t = 0
    const frame = () => {
      t += 0.016
      ctx.clearRect(0, 0, w, h)

      for (const s of stars) {
        s.x += s.vx
        s.y += s.vy
        if (s.y > h + 2) {
          s.y = -2
          s.x = Math.random() * w
        }
        if (s.x < -2) s.x = w + 2
        if (s.x > w + 2) s.x = -2
        const a = s.baseA * (0.55 + 0.45 * Math.sin(t * s.tw + s.phase))
        ctx.beginPath()
        ctx.fillStyle = `rgba(${starRGB},${a})`
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Shooting star scheduling
      nextShootIn -= 1
      if (!shooting && nextShootIn <= 0) {
        const fromLeft = Math.random() > 0.5
        const speed = Math.random() * 4 + 6
        shooting = {
          x: fromLeft ? Math.random() * w * 0.4 : w - Math.random() * w * 0.4,
          y: Math.random() * h * 0.4,
          vx: (fromLeft ? 1 : -1) * speed,
          vy: speed * 0.55,
          len: Math.random() * 80 + 90,
          life: 0,
          maxLife: 60,
        }
        nextShootIn = Math.round(Math.random() * 260 + 200)
      }

      if (shooting) {
        shooting.x += shooting.vx
        shooting.y += shooting.vy
        shooting.life += 1
        const fade = 1 - shooting.life / shooting.maxLife
        const tailX = shooting.x - (shooting.vx / Math.hypot(shooting.vx, shooting.vy)) * shooting.len
        const tailY = shooting.y - (shooting.vy / Math.hypot(shooting.vx, shooting.vy)) * shooting.len
        const grad = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY)
        grad.addColorStop(0, `rgba(${shootRGB},${0.9 * fade})`)
        grad.addColorStop(1, `rgba(${shootRGB},0)`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(shooting.x, shooting.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
        if (shooting.life >= shooting.maxLife || shooting.x < -120 || shooting.x > w + 120 || shooting.y > h + 120) {
          shooting = null
        }
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)

    if (reduce) {
      drawStatic()
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [theme, reduce])

  const orb = (duration: number) =>
    reduce ? undefined : { duration, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Nebula glows */}
      <motion.div
        className="absolute -top-40 left-1/4 h-[38rem] w-[38rem] rounded-full bg-indigo-600/20 dark:bg-indigo-600/25 blur-[130px]"
        animate={reduce ? undefined : { x: [0, 60, -30, 0], y: [0, 30, -20, 0], scale: [1, 1.12, 0.95, 1] }}
        transition={orb(26)}
      />
      <motion.div
        className="absolute top-1/4 -right-32 h-[34rem] w-[34rem] rounded-full bg-violet-600/15 dark:bg-violet-600/20 blur-[130px]"
        animate={reduce ? undefined : { x: [0, -50, 30, 0], y: [0, -30, 30, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={orb(30)}
      />
      <motion.div
        className="absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/12 blur-[130px]"
        animate={reduce ? undefined : { x: [0, 40, -40, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.9, 1] }}
        transition={orb(34)}
      />
      {/* Starfield */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
