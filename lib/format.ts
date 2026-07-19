/**
 * Shared money / number formatters for the Net Worth experience.
 * Centralised here so every surface renders currency identically
 * (previously each component re-implemented its own formatShort).
 */

const inrFull = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Full precision currency, e.g. ₹1,23,45,678 */
export function formatINR(amount: number): string {
  return inrFull.format(Math.round(amount))
}

/**
 * Compact Indian currency using Cr / L / K suffixes.
 * e.g. 12345678 -> ₹1.23 Cr, 250000 -> ₹2.5 L
 */
export function formatCompactINR(amount: number, digits = 2): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(digits)} Cr`
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(digits >= 1 ? 1 : 0)} L`
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(0)}K`
  return `${sign}₹${Math.round(abs)}`
}

/** Compact number without the ₹ symbol (for chart axes). */
export function formatAxisINR(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_00_00_000) return `${sign}${(abs / 1_00_00_000).toFixed(1)}Cr`
  if (abs >= 1_00_000) return `${sign}${(abs / 1_00_000).toFixed(1)}L`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`
  return `${sign}${Math.round(abs)}`
}

/** Signed compact currency, e.g. +₹2.5 L / -₹1.1 L */
export function formatSignedCompactINR(amount: number, digits = 2): string {
  if (amount === 0) return formatCompactINR(0, digits)
  const sign = amount > 0 ? '+' : '-'
  return `${sign}${formatCompactINR(Math.abs(amount), digits)}`
}

/** Signed full currency, e.g. +₹2,50,000 */
export function formatSignedINR(amount: number): string {
  if (amount === 0) return formatINR(0)
  const sign = amount > 0 ? '+' : '-'
  return `${sign}${formatINR(Math.abs(amount))}`
}

/** Signed percentage, e.g. +4.2% / -1.1%. Returns '—' when not meaningful. */
export function formatSignedPercent(percent: number | null | undefined, digits = 1): string {
  if (percent === null || percent === undefined || !isFinite(percent)) return '—'
  const sign = percent > 0 ? '+' : percent < 0 ? '' : ''
  return `${sign}${percent.toFixed(digits)}%`
}

/** Placeholder used when values are hidden for privacy. */
export const MASK = '••••••'
