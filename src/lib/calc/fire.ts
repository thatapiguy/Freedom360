import type { Household, IncomeSource } from "@/lib/types";
import { projectHousehold } from "@/lib/calc/projection";

/** Weighted-average expected real return across all accounts, by balance. */
function weightedAverageReturn(household: Household): number {
  const total = household.accounts.reduce((s, a) => s + a.balance, 0);
  if (total <= 0) {
    const accounts = household.accounts;
    return (
      accounts.reduce((s, a) => s + a.expectedReturn, 0) /
      (accounts.length || 1)
    );
  }
  return household.accounts.reduce(
    (s, a) => s + a.expectedReturn * (a.balance / total),
    0
  );
}

export interface FireNumberResult {
  /** Annual spending target used for the calculation, in today's dollars. */
  annualSpending: number;
  safeWithdrawalRate: number;
  /** Portfolio needed at retirement to sustain annualSpending at the given SWR. */
  fireNumber: number;
}

export function computeFireNumber(
  household: Household,
  safeWithdrawalRate = 0.04
): FireNumberResult {
  return {
    annualSpending: household.assumptions.annualRetirementSpending,
    safeWithdrawalRate,
    fireNumber: household.assumptions.annualRetirementSpending / safeWithdrawalRate,
  };
}

export interface CoastFireResult extends FireNumberResult {
  currentInvestedTotal: number;
  yearsToTraditionalRetirement: number;
  /** Portfolio needed TODAY (with zero further contributions) to reach fireNumber by retirement age, given expected growth. */
  coastNumberToday: number;
  isCoastFI: boolean;
  gapToCoast: number;
  assumedAnnualReturn: number;
}

/**
 * Coast FIRE: if your current invested balance alone — with no further
 * contributions — will grow to your FIRE number by your planned
 * retirement age, you're "coast FI" and further saving is optional.
 */
export function computeCoastFire(
  household: Household,
  safeWithdrawalRate = 0.04
): CoastFireResult {
  const base = computeFireNumber(household, safeWithdrawalRate);
  const currentInvestedTotal = household.accounts.reduce(
    (s, a) => s + a.balance,
    0
  );
  const yearsToTraditionalRetirement = Math.max(
    0,
    household.primary.retirementAge - household.primary.currentAge
  );
  const assumedAnnualReturn = weightedAverageReturn(household);
  const coastNumberToday =
    base.fireNumber / Math.pow(1 + assumedAnnualReturn, yearsToTraditionalRetirement);

  return {
    ...base,
    currentInvestedTotal,
    yearsToTraditionalRetirement,
    coastNumberToday,
    isCoastFI: currentInvestedTotal >= coastNumberToday,
    gapToCoast: coastNumberToday - currentInvestedTotal,
    assumedAnnualReturn,
  };
}

export interface BaristaFireInputs {
  /** Age the user wants to semi-retire and start part-time work. */
  semiRetirementAge: number;
  /** Annual part-time income in today's dollars. */
  partTimeIncome: number;
  /** Age part-time work stops (full retirement). */
  partTimeEndAge: number;
}

/**
 * Barista FIRE: retire earlier than planned by covering part of your
 * spending with part-time income for a stretch, letting the portfolio
 * cover only the gap. Reuses the main projection engine with the
 * part-time income layered in and retirement pulled forward.
 */
export function projectBaristaFire(
  household: Household,
  inputs: BaristaFireInputs
) {
  const partTimeIncomeSource: IncomeSource = {
    id: "barista-income",
    name: "Part-time income",
    type: "other",
    owner: "primary",
    annualAmount: inputs.partTimeIncome,
    startAge: inputs.semiRetirementAge,
    endAge: inputs.partTimeEndAge,
    colaPct: 0,
  };

  return projectHousehold(household, {
    retirementAgeOverride: inputs.semiRetirementAge,
    extraIncomeSources: [partTimeIncomeSource],
  });
}
