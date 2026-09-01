export type FilingStatus = "single" | "married";

export interface Person {
  name: string;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
}

export type AccountType = "taxable" | "traditional" | "roth" | "hsa";

export type Owner = "primary" | "spouse" | "joint";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  owner: Owner;
  balance: number;
  /** Annual contribution while still working, in today's dollars. */
  annualContribution: number;
  /** Annual employer match while still working, in today's dollars. */
  employerMatch: number;
  /**
   * Expected annual return ABOVE inflation (real return), e.g. 0.05 for
   * 5%. The whole projection engine works in today's dollars, so use a
   * real, not nominal, return here.
   */
  expectedReturn: number;
  /** Annual return standard deviation (real terms), used for Monte Carlo sampling. */
  returnStdDev: number;
}

export type IncomeType =
  | "salary"
  | "socialSecurity"
  | "pension"
  | "rental"
  | "other";

export interface IncomeSource {
  id: string;
  name: string;
  type: IncomeType;
  owner: "primary" | "spouse";
  /** Annual amount in today's dollars. */
  annualAmount: number;
  /** Age of the owner when this income starts. */
  startAge: number;
  /** Age of the owner when this income ends. Omit for lifetime income. */
  endAge?: number;
  /**
   * Annual REAL (inflation-adjusted) growth rate applied to this income
   * source's value each year, e.g. 0 for Social Security (assumed to keep
   * pace with inflation), a small negative number for a fixed pension
   * that isn't COLA'd.
   */
  colaPct: number;
}

export type SpendingGoalCategory =
  | "charity_gift"
  | "dependent_support"
  | "education"
  | "health_care"
  | "home_purchase"
  | "renovation"
  | "vacation"
  | "vehicle"
  | "wedding"
  | "other_expense";

export type IncomeEventCategory =
  | "annuity_income"
  | "inheritance"
  | "pension_income"
  | "rental_income"
  | "sale_of_property"
  | "work_during_retirement"
  | "other_income";

export type LifeEventCategory = SpendingGoalCategory | IncomeEventCategory;

export type LifeEventTiming =
  | { mode: "oneTime"; age: number }
  | {
      mode: "recurring";
      startAge: number;
      endAge: number;
      /** Annual REAL growth rate applied while the event is active, same convention as IncomeSource.colaPct. */
      growthPct: number;
    };

/**
 * A spending goal or income event tied to a specific stage of life — a
 * wedding, a home purchase, an inheritance, a few years of part-time work
 * in retirement. Unlike the household's core guaranteed-income list, these
 * can land at any age, before or after retirement.
 */
export interface LifeEvent {
  id: string;
  name: string;
  kind: "expense" | "income";
  category: LifeEventCategory;
  owner: "primary" | "spouse";
  /** One-time: the total lump sum. Recurring: the annual amount, in today's dollars. */
  amount: number;
  timing: LifeEventTiming;
}

export type WithdrawalStrategy = "fixedReal" | "guytonKlinger" | "vpw";

export interface Assumptions {
  currentYear: number;
  filingStatus: FilingStatus;
  /**
   * General inflation assumption, shown for reference and used to convert
   * any nominal figures you enter elsewhere. All projection math itself is
   * done in real (today's) dollars.
   */
  inflationRate: number;
  /** Annual retirement spending target in today's dollars (excludes healthcare bridge & life events). */
  annualRetirementSpending: number;
  /** Extra annual healthcare spending in today's dollars before Medicare eligibility (65). */
  healthcareBridgeAnnual: number;
  withdrawalStrategy: WithdrawalStrategy;
  /** Order accounts are drawn down in retirement. */
  withdrawalOrder: AccountType[];
  /** Fraction of a taxable-account withdrawal treated as a realized capital gain, e.g. 0.3. */
  taxableGainFraction: number;
  monteCarloRuns: number;
}

export interface Household {
  primary: Person;
  spouse?: Person;
  accounts: Account[];
  incomeSources: IncomeSource[];
  lifeEvents: LifeEvent[];
  assumptions: Assumptions;
}

export interface Scenario {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  household: Household;
}

export interface AccountYearBreakdown {
  type: AccountType;
  startBalance: number;
  contributions: number;
  growth: number;
  withdrawals: number;
  endBalance: number;
}

export interface YearResult {
  year: number;
  primaryAge: number;
  spouseAge?: number;
  phase: "accumulation" | "retirement";
  totalBalance: number;
  accounts: AccountYearBreakdown[];
  guaranteedIncome: number;
  spendingNeed: number;
  grossWithdrawal: number;
  taxesPaid: number;
  netCashFlow: number;
  depleted: boolean;
}

export interface ProjectionResult {
  years: YearResult[];
  /** First year the portfolio hits zero during retirement, if any. */
  depletionYear?: number;
  finalBalance: number;
}

export interface MonteCarloYearBand {
  year: number;
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MonteCarloResult {
  successRate: number;
  bands: MonteCarloYearBand[];
  runs: number;
  medianFinalBalance: number;
}
