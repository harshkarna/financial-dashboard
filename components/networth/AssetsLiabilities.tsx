'use client'

import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ChevronDown, Droplets, Wallet, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatCompactINR, formatINR, formatSignedCompactINR } from '@/lib/format'
import { AssetRow, debtProfile, holdingsBreakdown, liquidity } from '@/lib/netWorth'

// Cost-basis items tracked at market value elsewhere — excluded from totals
// (preserves the original AssetBreakdown business rule).
const EXCLUDED_ITEMS = ['Invested Mutual Funds', 'Invested Stock']

const ASSET_PALETTE = ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#a78bfa', '#f472b6', '#64748b']

interface AssetsLiabilitiesProps {
  assets: AssetRow[]
  liabilities: AssetRow[]
  prevAssets: AssetRow[] | null
  netWorth: number
}

interface Group {
  type: string
  total: number
  items: AssetRow[]
}

function groupByType(rows: AssetRow[], exclude: boolean): Group[] {
  const map = new Map<string, Group>()
  for (const row of rows) {
    if (exclude && EXCLUDED_ITEMS.includes(row.item)) continue
    const key = row.type || 'Other'
    if (!map.has(key)) map.set(key, { type: key, total: 0, items: [] })
    const g = map.get(key)!
    g.total += row.amount
    g.items.push(row)
  }
  return Array.from(map.values())
    .filter((g) => g.total !== 0)
    .sort((a, b) => b.total - a.total)
}

type AssetView = 'type' | 'holding'

export function AssetsLiabilities({ assets, liabilities, prevAssets, netWorth }: AssetsLiabilitiesProps) {
  const { hidden, mask } = usePrivacy()
  const [view, setView] = useState<AssetView>('type')

  const assetGroups = useMemo(() => groupByType(assets, true), [assets])
  const liabilityGroups = useMemo(() => groupByType(liabilities, false), [liabilities])
  const holdings = useMemo(
    () => holdingsBreakdown(assets.filter((a) => !EXCLUDED_ITEMS.includes(a.item)), prevAssets, netWorth),
    [assets, prevAssets, netWorth],
  )

  const totalAssets = useMemo(() => assetGroups.reduce((s, g) => s + g.total, 0), [assetGroups])
  const totalLiabilities = useMemo(() => liabilityGroups.reduce((s, g) => s + g.total, 0), [liabilityGroups])
  const debt = useMemo(() => debtProfile(liabilities), [liabilities])
  const liquid = useMemo(() => liquidity(assets, netWorth), [assets, netWorth])

  const money = (n: number, compact = false) => mask(compact ? formatCompactINR(n) : formatINR(n))

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Summary strip */}
      <div className="nw-card p-5 lg:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Total Assets" value={money(totalAssets)} tone="gain" icon={<Wallet className="h-4 w-4" />} />
          <Stat
            label="Total Liabilities"
            value={money(totalLiabilities)}
            sub={debt.isDebtFree ? 'Tax provision only · no debt' : undefined}
            tone="loss"
            icon={<CreditCard className="h-4 w-4" />}
          />
          <Stat
            label="Liquidity"
            value={hidden ? mask(formatCompactINR(liquid.amount)) : `${liquid.percent.toFixed(1)}%`}
            sub={hidden ? undefined : `${formatCompactINR(liquid.amount, 1)} liquid`}
            tone="neutral"
            icon={<Droplets className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Assets */}
      <div className="nw-card p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <Header title="Assets" subtitle="What you own" tone="gain" />
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5" role="tablist" aria-label="Asset view">
            {(['type', 'holding'] as AssetView[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                data-active={view === v}
                onClick={() => setView(v)}
                className="nw-control px-2.5 py-1 capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              >
                {v === 'type' ? 'By type' : 'By holding'}
              </button>
            ))}
          </div>
        </div>

        {view === 'type' ? (
          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
            <Donut groups={assetGroups} total={totalAssets} hidden={hidden} />
            <div className="flex-1 w-full space-y-1.5">
              {assetGroups.map((g, i) => (
                <AllocationRow
                  key={g.type}
                  group={g}
                  total={totalAssets}
                  color={ASSET_PALETTE[i % ASSET_PALETTE.length]}
                  money={money}
                />
              ))}
              {assetGroups.length === 0 && <Empty />}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            {holdings.map((h) => (
              <div key={h.item} className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm nw-text-primary truncate">{h.item}</p>
                  <p className="text-[11px] nw-text-muted">
                    {h.type} · {h.percentOfNetWorth.toFixed(1)}% of net worth
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="tabnums text-sm font-semibold nw-text-primary">{money(h.amount, true)}</p>
                  {h.change !== null && h.change !== 0 && (
                    <p className={`tabnums text-[11px] inline-flex items-center gap-0.5 ${h.change >= 0 ? 'nw-gain' : 'nw-loss'}`}>
                      {h.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {mask(formatSignedCompactINR(h.change, 1))}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {holdings.length === 0 && <Empty />}
          </div>
        )}
      </div>

      {/* Liabilities */}
      <div className="nw-card p-5">
        <div className="flex items-center justify-between">
          <Header title="Liabilities" subtitle="What you owe" tone="loss" />
          {debt.isDebtFree && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 nw-gain">Debt-free</span>
          )}
        </div>
        <div className="mt-4 space-y-1.5">
          {liabilityGroups.map((g) => (
            <AllocationRow key={g.type} group={g} total={totalLiabilities} color="#ef4444" money={money} />
          ))}
          {liabilityGroups.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm nw-gain font-medium">No liabilities</p>
              <p className="text-xs nw-text-muted mt-0.5">Nothing recorded this month</p>
            </div>
          )}
        </div>
        {debt.isDebtFree && debt.taxProvision > 0 && (
          <p className="mt-3 pt-3 border-t nw-hairline text-[11px] nw-text-muted">
            The only liability is a tax provision ({money(debt.taxProvision, true)}) set aside for taxes — not borrowed debt.
          </p>
        )}
      </div>
    </section>
  )
}

function Header({ title, subtitle, tone }: { title: string; subtitle: string; tone: 'gain' | 'loss' }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-2 w-2 rounded-full ${tone === 'gain' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <div>
        <h2 className="text-base font-semibold nw-text-primary">{title}</h2>
        <p className="text-xs nw-text-muted">{subtitle}</p>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string
  value: string
  sub?: string
  tone: 'gain' | 'loss' | 'neutral'
  icon: React.ReactNode
}) {
  const toneClass = tone === 'gain' ? 'nw-gain' : tone === 'loss' ? 'nw-loss' : 'nw-text-primary'
  return (
    <div className="flex items-center gap-3">
      <span className="grid place-items-center h-9 w-9 rounded-lg bg-slate-100 dark:bg-white/5 nw-text-secondary shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs nw-text-secondary">{label}</p>
        <p className={`tabnums text-lg font-semibold truncate ${toneClass}`}>{value}</p>
        {sub && <p className="text-[11px] nw-text-muted truncate">{sub}</p>}
      </div>
    </div>
  )
}

function Donut({ groups, total, hidden }: { groups: Group[]; total: number; hidden: boolean }) {
  if (groups.length === 0 || total <= 0) return null
  const data = groups.map((g) => ({ name: g.type, value: g.total }))
  return (
    <div className="relative h-32 w-32 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={44} outerRadius={62} paddingAngle={2} stroke="none" isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={ASSET_PALETTE[i % ASSET_PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide nw-text-muted">Assets</p>
          <p className="tabnums text-sm font-semibold nw-text-primary">{hidden ? '••••' : formatCompactINR(total, 2)}</p>
        </div>
      </div>
    </div>
  )
}

function AllocationRow({
  group,
  total,
  color,
  money,
}: {
  group: Group
  total: number
  color: string
  money: (n: number, compact?: boolean) => string
}) {
  const [open, setOpen] = useState(false)
  const pct = total > 0 ? (group.total / total) * 100 : 0
  const hasItems = group.items.length > 1

  return (
    <div className="rounded-lg">
      <button
        type="button"
        onClick={() => hasItems && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 py-1.5 px-2 rounded-lg text-left ${
          hasItems ? 'hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer' : 'cursor-default'
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50`}
        aria-expanded={hasItems ? open : undefined}
      >
        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
        <span className="flex-1 min-w-0">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm nw-text-primary truncate">{group.type}</span>
            <span className="tabnums text-sm font-semibold nw-text-primary shrink-0">{money(group.total, true)}</span>
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </span>
            <span className="tabnums text-[11px] nw-text-muted w-9 text-right">{pct.toFixed(0)}%</span>
            {hasItems && <ChevronDown className={`h-3.5 w-3.5 nw-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />}
          </span>
        </span>
      </button>

      {open && hasItems && (
        <div className="ml-5 mt-1 mb-1.5 pl-3 border-l nw-hairline space-y-1">
          {group.items
            .slice()
            .sort((a, b) => b.amount - a.amount)
            .map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-xs nw-text-secondary truncate max-w-[65%]">{item.item}</span>
                <span className="tabnums text-xs nw-text-primary shrink-0">{money(item.amount, true)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function Empty() {
  return <p className="py-6 text-center text-sm nw-text-muted">No data for this month</p>
}
