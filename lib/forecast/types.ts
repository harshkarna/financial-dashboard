/**
 * Forecast engine — typed inputs and outputs.
 *
 * Everything here is plain data. The engine (engine.ts) is a pure function of
 * these types so it can be unit-tested and memoised. Amounts are rupees held as
 * JS numbers; we round only for display, never during intermediate maths.
 */

// ---------------------------------------------------------------------------
// Asset classes
// ---------------------------------------------------------------------------

/** Forecastable asset buckets. Vehicle is the only depreciating class today. */
export type AssetClassId =
  | 'cash'
  | 'mutualFunds'
  | 'stocks'
  | 'rsu'
  | 'pf'
  | 'realEstate'
  | 'gold'
  | 'crypto'
  | 'vehicle'
  | 'other'

export const ASSET_CLASS_LABELS: Record<AssetClassId, string> = {
  cash: 'Cash & Bank',
  mutualFunds: 'Mutual Funds',
  stocks: 'Stocks',
  rsu: 'RSUs & ESPP',
  pf: 'Provident Fund',
  realEstate: 'Real Estate',
  gold: 'Gold',
  crypto: 'Crypto',
  vehicle: 'Vehicle',
  other: 'Other Assets',
}

/** Stable display / iteration order. */
export const ASSET_CLASS_ORDER: AssetClassId[] = [
  'cash',
  'mutualFunds',
  'stocks',
  'rsu',
  'pf',
  'realEstate',
  'gold',
  'crypto',
  'vehicle',
  'other',
]

// ---------------------------------------------------------------------------
// Assumptions
// ---------------------------------------------------------------------------

export interface EmploymentAssumptions {
  /** Annual base salary (gross). */
  annualBase: number
  /** Annual cash bonus (gross). */
  annualBonus: number
  /** Annual RSU vesting value (gross). */
  annualRsuVesting: number
  /** Monthly PF contribution added straight to the PF balance. */
  monthlyPfContribution: number
  /** Annual increment applied to base + bonus, compounding each forecast year. */
  annualIncrementPct: number
  /** Annual growth of RSU grant value (proxy for stock appreciation on new vests). */
  rsuGrowthPct: number
  /** Blended effective tax + statutory deduction rate on employment income. */
  effectiveTaxPct: number
}

export interface PluralsightAssumptions {
  /** Starting monthly income (trailing average from Other Income). */
  monthlyIncome: number
  /** Annual growth (may be negative to model decline). */
  annualGrowthPct: number
  effectiveTaxPct: number
}

export interface OtherIncomeAssumptions {
  monthlyIncome: number
  annualGrowthPct: number
  effectiveTaxPct: number
}

export interface ExpenseAssumptions {
  /** Monthly recurring expense baseline (before inflation). */
  monthlyBaseline: number
  annualInflationPct: number
}

export interface AssetAssumption {
  id: AssetClassId
  label: string
  /** Current market value (the balance-sheet anchor, from live data). */
  startingValue: number
  /** Expected annual return (%). Negative for depreciating assets. */
  annualReturnPct: number
  /** Share (0–100) of investable surplus routed here. Sums to 100 across investable classes. */
  contributionPct: number
  /** Whether surplus can be contributed to this class. */
  investable: boolean
}

export interface LiabilityAssumptions {
  /** Outstanding income tax provision (reduces net worth until paid). */
  taxOutstanding: number
  /** Forecast-month offset (0-based) at which the tax provision is settled. */
  taxPaymentMonthOffset: number
  /** Generic loan balance (0 today; supported for scenarios). */
  loanBalance: number
  loanAnnualRatePct: number
  loanMonthlyPayment: number
}

// ---------------------------------------------------------------------------
// Scenario events (Phase 2) — timed "what-if" changes layered on the baseline
// ---------------------------------------------------------------------------

export type ScenarioEventType =
  | 'jobSwitch'
  | 'pluralsightChange'
  | 'expenseChange'
  | 'cashflow'
  | 'purchase'

export const SCENARIO_EVENT_LABELS: Record<ScenarioEventType, string> = {
  jobSwitch: 'Job switch',
  pluralsightChange: 'Pluralsight change',
  expenseChange: 'Expense change',
  cashflow: 'One-off cash flow',
  purchase: 'Major purchase',
}

interface BaseEvent {
  id: string
  type: ScenarioEventType
  label: string
  /** 0-based month offset from the forecast start when the event takes effect. */
  monthOffset: number
  enabled: boolean
}

/** Job change: a step change to salary (+ optional break, joining bonus, RSU reset). */
export interface JobSwitchEvent extends BaseEvent {
  type: 'jobSwitch'
  /** % change applied to base + bonus from this month on (may be negative). */
  salaryHikePct: number
  /** New annual RSU vesting value (absolute ₹). null keeps the current RSU. */
  newAnnualRsu: number | null
  /** One-time joining / sign-on bonus (gross; taxed at the salary rate). */
  joiningBonus: number
  /** Months with zero salary (career break / gap between jobs). */
  monthsWithoutSalary: number
  /** Permanent % change to the expense baseline (relocation, lifestyle creep). */
  expenseChangePct: number
}

/** Pluralsight income change: scale, set, or shut down (optionally temporary). */
export interface PluralsightChangeEvent extends BaseEvent {
  type: 'pluralsightChange'
  action: 'multiply' | 'setMonthly' | 'shutdown'
  /** For 'multiply' a factor (0.5 = halve); for 'setMonthly' an absolute ₹/month. */
  value: number
  /** 0 = permanent; otherwise the effect lasts this many months, then reverts. */
  durationMonths: number
}

/** A permanent step change to the monthly expense baseline. */
export interface ExpenseChangeEvent extends BaseEvent {
  type: 'expenseChange'
  changePct: number
}

/** A one-time, untaxed cash flow: +windfall / −large expense. */
export interface CashflowEvent extends BaseEvent {
  type: 'cashflow'
  amount: number
}

/** A financed (or cash) purchase: adds an asset, spends cash, optionally a loan. */
export interface PurchaseEvent extends BaseEvent {
  type: 'purchase'
  /** Where the purchased asset lands (e.g. realEstate, vehicle). */
  assetClass: AssetClassId
  /** Full purchase price, added to that asset class. */
  price: number
  /** Cash paid upfront (reduces cash immediately). */
  downPayment: number
  /** Financed amount added to liabilities. */
  loanAmount: number
  loanMonthlyPayment: number
  loanRatePct: number
}

export type ScenarioEvent =
  | JobSwitchEvent
  | PluralsightChangeEvent
  | ExpenseChangeEvent
  | CashflowEvent
  | PurchaseEvent

// ---------------------------------------------------------------------------
// Financial Independence (retirement) assumptions & result
// ---------------------------------------------------------------------------

export interface FIAssumptions {
  /** Annual living cost in retirement, expressed in today's money. */
  annualSpendToday: number
  /** Safe withdrawal rate — % of the corpus withdrawn each year. */
  swrPct: number
  /** Inflation used to grow the spend to the retirement year. */
  inflationPct: number
  /** Passive income (annual, today's money) that offsets the retirement spend. */
  passiveAnnualIncome: number
  /** Whether home + vehicle count toward the FI corpus (they're illiquid). */
  includeHomeAndVehicle: boolean
}

export interface FIResult {
  /** Corpus needed today to retire now at the given SWR. */
  requiredCorpusToday: number
  /** Safe income the current net worth could throw off (₹/month) at the SWR. */
  safeMonthlyIncomeNow: number
  achieved: boolean
  date: string | null
  monthsAway: number | null
  /** Inflation-grown corpus required at the projected FI month. */
  requiredCorpusAtFI: number
  /** Qualifying net worth at the FI month (liquid, per the toggle). */
  netWorthAtFI: number | null
  /** requiredCorpusToday − current net worth (how far off you are today). */
  gapToday: number
}

export interface ForecastAssumptions {
  employment: EmploymentAssumptions
  pluralsight: PluralsightAssumptions
  otherIncome: OtherIncomeAssumptions
  expenses: ExpenseAssumptions
  assets: AssetAssumption[]
  liabilities: LiabilityAssumptions
  /** Share (0–100) of positive monthly surplus that gets invested; the rest is kept as cash. */
  investShareOfSurplusPct: number
  /** Timed "what-if" life events layered on the baseline projection. */
  events: ScenarioEvent[]
  /** Financial-independence / retirement assumptions. */
  fi: FIAssumptions
}

/** Human-readable provenance for each headline assumption ("source" chips). */
export interface AssumptionSources {
  expenses: string
  pluralsight: string
  employment: string
  startingValues: string
  taxOutstanding: string
}

export interface CalibrationProfile {
  startDate: { month: number; year: number }
  startNetWorth: number
  assumptions: ForecastAssumptions
  sources: AssumptionSources
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export type BuiltInScenarioId = 'base' | 'conservative' | 'aggressive'

export interface ForecastScenario {
  id: string
  name: string
  builtIn: boolean
  /** For built-ins, which return/growth preset this derives from. */
  preset: BuiltInScenarioId
  assumptions: ForecastAssumptions
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface MonthlyForecastPoint {
  index: number
  date: string
  month: number
  year: number
  kind: 'actual' | 'forecast'
  grossIncome: number
  afterTaxIncome: number
  salaryIncome: number
  pluralsightIncome: number
  otherIncome: number
  expenses: number
  taxes: number
  debtInterest: number
  investibleSurplus: number
  valueByAsset: Record<AssetClassId, number>
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  cumulativeContributions: number
  cumulativeReturns: number
  cumulativeDepreciation: number
}

export interface AnnualForecastSummary {
  year: number
  startingNetWorth: number
  salaryIncome: number
  pluralsightIncome: number
  otherIncome: number
  expenses: number
  taxes: number
  contributions: number
  investmentGrowth: number
  depreciation: number
  endingLiabilities: number
  endingNetWorth: number
  yoyGrowthPct: number | null
  months: MonthlyForecastPoint[]
}

export interface MilestoneResult {
  value: number
  label: string
  achieved: boolean
  date: string | null
  monthsAway: number | null
}

export interface ForecastResult {
  startDate: string
  startNetWorth: number
  monthly: MonthlyForecastPoint[]
  annual: AnnualForecastSummary[]
  milestones: MilestoneResult[]
  /** endingNetWorth, plus attribution totals for the whole horizon. */
  endingNetWorth: number
  totalContributions: number
  totalReturns: number
  totalDepreciation: number
  /** True when the reconciliation identity holds within tolerance. */
  reconciles: boolean
}

// ---------------------------------------------------------------------------
// Horizons
// ---------------------------------------------------------------------------

export type HorizonKey = '1Y' | '3Y' | '5Y' | '10Y' | '15Y'

export const HORIZONS: { key: HorizonKey; label: string; years: number }[] = [
  { key: '1Y', label: '1Y', years: 1 },
  { key: '3Y', label: '3Y', years: 3 },
  { key: '5Y', label: '5Y', years: 5 },
  { key: '10Y', label: '10Y', years: 10 },
  { key: '15Y', label: '15Y', years: 15 },
]
