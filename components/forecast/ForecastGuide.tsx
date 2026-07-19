'use client'

import { HelpCircle } from 'lucide-react'

/**
 * A collapsible, self-contained explainer so anyone viewing the page
 * understands what the scenarios and headline terms mean.
 */
export function ForecastGuide() {
  return (
    <details className="nw-card group">
      <summary className="flex items-center gap-2 p-4 cursor-pointer list-none select-none">
        <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <span className="text-sm font-medium nw-text-primary">
          What do these scenarios and terms mean?
        </span>
        <span className="ml-auto text-xs nw-text-muted group-open:hidden">Show</span>
        <span className="ml-auto text-xs nw-text-muted hidden group-open:inline">Hide</span>
      </summary>

      <div className="px-4 pb-4 space-y-4 border-t nw-hairline pt-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide nw-text-muted mb-2">Scenarios</h4>
          <p className="text-sm nw-text-secondary mb-2">
            Each scenario is a bundle of assumptions — mainly the expected annual returns on your
            assets, salary growth, and inflation. The starting net worth and income model stay the
            same; only the optimism changes. Every value is editable.
          </p>
          <ul className="space-y-1.5 text-sm nw-text-secondary">
            <li><span className="font-medium nw-text-primary">Conservative</span> — cautious returns (mutual funds ~7%, stocks ~6%), smaller raises, Pluralsight declining. A “things go poorly” floor.</li>
            <li><span className="font-medium nw-text-primary">Base</span> — realistic middle (mutual funds ~11%, stocks ~10%, RSUs ~10%). Your most-likely path.</li>
            <li><span className="font-medium nw-text-primary">Aggressive</span> — optimistic returns (mutual funds ~14%, stocks ~15%), stronger raises. A “things go well” ceiling.</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide nw-text-muted mb-2">Key terms</h4>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Term term="Projected net worth" def="Estimated assets minus liabilities at the end of the selected horizon." />
            <Term term="Contributions" def="New money you add over time (income saved & invested) — not market gains." />
            <Term term="Market growth" def="Gains from investment returns, net of any depreciation (e.g. vehicle)." />
            <Term term="Monthly surplus" def="What’s left each month after tax and expenses, available to invest." />
            <Term term="Milestone" def="When your projected net worth first crosses ₹2 / ₹5 / ₹10 Cr." />
            <Term term="RSU growth" def="Assumed annual appreciation of employer equity (seeded from Uber’s historical return)." />
            <Term term="Life events" def="Timed what-ifs — a job switch, career break, course-income change, big purchase, or windfall — layered on the projection." />
          </dl>
        </div>
      </div>
    </details>
  )
}

function Term({ term, def }: { term: string; def: string }) {
  return (
    <div>
      <dt className="font-medium nw-text-primary">{term}</dt>
      <dd className="nw-text-secondary">{def}</dd>
    </div>
  )
}
