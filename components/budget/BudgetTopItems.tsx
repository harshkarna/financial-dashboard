'use client'

import { useMemo, useState } from 'react'
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { formatCompactINR, formatINR } from '@/lib/format'
import { ExpenseItem, topLineItems, biggestExpenses } from '@/lib/budget'

interface BudgetTopItemsProps {
  expenses: ExpenseItem[]
}

type Tab = 'merchants' | 'transactions'

export function BudgetTopItems({ expenses }: BudgetTopItemsProps) {
  const { mask } = usePrivacy()
  const [tab, setTab] = useState<Tab>('merchants')
  const [open, setOpen] = useState(true)

  const merchants = useMemo(() => topLineItems(expenses, 8), [expenses])
  const transactions = useMemo(() => biggestExpenses(expenses, 8), [expenses])
  const maxMerchant = merchants[0]?.amount ?? 1
  const maxTxn = transactions[0]?.amount ?? 1

  return (
    <section className="nw-card overflow-hidden" aria-label="Top spending items">
      <div className="flex items-center justify-between px-5 py-4 border-b nw-hairline">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 min-w-0">
          <Receipt className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <h2 className="text-base font-semibold nw-text-primary truncate">Top Spending</h2>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-white/5 p-0.5">
            <button
              onClick={() => setTab('merchants')}
              data-active={tab === 'merchants'}
              className="nw-control px-2.5 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              By item
            </button>
            <button
              onClick={() => setTab('transactions')}
              data-active={tab === 'transactions'}
              className="nw-control px-2.5 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              Biggest
            </button>
          </div>
          <button onClick={() => setOpen((o) => !o)} className="nw-control rounded-lg p-1.5" aria-label={open ? 'Collapse' : 'Expand'}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-5">
          {(tab === 'merchants' ? merchants.length : transactions.length) === 0 ? (
            <p className="text-sm nw-text-secondary">No expenses in this period.</p>
          ) : (
            <ul className="space-y-3">
              {tab === 'merchants'
                ? merchants.map((m) => (
                    <ItemRow
                      key={m.breakdown}
                      title={m.breakdown}
                      meta={`${m.category || 'Uncategorized'} · ${m.count} item${m.count > 1 ? 's' : ''}`}
                      amount={mask(formatINR(m.amount))}
                      ratio={m.amount / maxMerchant}
                    />
                  ))
                : transactions.map((t, i) => (
                    <ItemRow
                      key={`${t.breakdown}-${i}`}
                      title={t.breakdown}
                      meta={`${t.category || 'Uncategorized'} · ${t.month}`}
                      amount={mask(formatINR(t.amount))}
                      ratio={t.amount / maxTxn}
                    />
                  ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function ItemRow({ title, meta, amount, ratio }: { title: string; meta: string; amount: string; ratio: number }) {
  return (
    <li>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm nw-text-primary truncate min-w-0" title={title}>{title}</span>
        <span className="tabnums text-sm font-medium nw-text-primary shrink-0">{amount}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <div
          className="h-full rounded-full bg-indigo-500/70 dark:bg-indigo-400/70"
          style={{ width: `${Math.max(4, Math.min(ratio * 100, 100))}%` }}
        />
      </div>
      <p className="mt-0.5 text-[11px] nw-text-muted truncate">{meta}</p>
    </li>
  )
}
