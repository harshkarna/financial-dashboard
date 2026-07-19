'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatCompactINR, formatSignedCompactINR, formatSignedPercent } from '@/lib/format'
import { GainsSummary } from '@/lib/netWorth'

interface InvestmentGainsProps {
  gains: GainsSummary
}

export function InvestmentGains({ gains }: InvestmentGainsProps) {
  const { mask } = usePrivacy()
  if (gains.rows.length === 0 || gains.totalInvested <= 0) return null

  const up = gains.totalGain >= 0
  const toneClass = up ? 'nw-gain' : 'nw-loss'

  return (
    <section className="nw-card p-5" aria-label="Investment returns">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold nw-text-primary">Investment Returns</h2>
          <p className="text-xs nw-text-muted">Market value vs invested cost</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
            up ? 'bg-emerald-500/10 nw-gain' : 'bg-red-500/10 nw-loss'
          }`}
        >
          {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {formatSignedPercent(gains.totalPercent)}
        </span>
      </div>

      {/* Total */}
      <div className="nw-inset p-4">
        <div className="grid grid-cols-3 gap-2">
          <Cell label="Invested" value={mask(formatCompactINR(gains.totalInvested))} />
          <Cell label="Market value" value={mask(formatCompactINR(gains.totalMarket))} />
          <Cell label="Unrealized gain" value={mask(formatSignedCompactINR(gains.totalGain))} tone={toneClass} />
        </div>
      </div>

      {/* Per-asset */}
      <div className="mt-3 space-y-2">
        {gains.rows.map((r) => {
          const rUp = r.gain >= 0
          return (
            <div key={r.label} className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-sm nw-text-primary min-w-0 truncate">{r.label}</span>
              <div className="flex items-center gap-3 shrink-0 tabnums">
                <span className="text-xs nw-text-muted">
                  {mask(formatCompactINR(r.invested, 1))} <span className="opacity-60">→</span>{' '}
                  {mask(formatCompactINR(r.market, 1))}
                </span>
                <span className={`text-sm font-semibold ${rUp ? 'nw-gain' : 'nw-loss'}`}>
                  {mask(formatSignedCompactINR(r.gain, 1))}
                  <span className="ml-1 text-xs opacity-80">{formatSignedPercent(r.percent)}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[11px] nw-text-secondary">{label}</p>
      <p className={`tabnums text-base font-semibold truncate ${tone ?? 'nw-text-primary'}`}>{value}</p>
    </div>
  )
}
