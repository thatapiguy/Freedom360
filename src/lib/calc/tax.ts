import type { FilingStatus } from "@/lib/types";

/**
 * Simplified federal tax model (2025 brackets, not state tax, not adjusted
 * for inflation over the projection). Good enough for relative comparisons
 * between withdrawal strategies and Roth-conversion scenarios; not a
 * substitute for professional tax advice.
 */

interface Bracket {
  rate: number;
  upTo: number; // upper bound of taxable income in this bracket, Infinity for top
}

const ORDINARY_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { rate: 0.1, upTo: 11_925 },
    { rate: 0.12, upTo: 48_475 },
    { rate: 0.22, upTo: 103_350 },
    { rate: 0.24, upTo: 197_300 },
    { rate: 0.32, upTo: 250_525 },
    { rate: 0.35, upTo: 626_350 },
    { rate: 0.37, upTo: Infinity },
  ],
  married: [
    { rate: 0.1, upTo: 23_850 },
    { rate: 0.12, upTo: 96_950 },
    { rate: 0.22, upTo: 206_700 },
    { rate: 0.24, upTo: 394_600 },
    { rate: 0.32, upTo: 501_050 },
    { rate: 0.35, upTo: 751_600 },
    { rate: 0.37, upTo: Infinity },
  ],
};

const LTCG_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { rate: 0, upTo: 48_350 },
    { rate: 0.15, upTo: 533_400 },
    { rate: 0.2, upTo: Infinity },
  ],
  married: [
    { rate: 0, upTo: 96_700 },
    { rate: 0.15, upTo: 600_050 },
    { rate: 0.2, upTo: Infinity },
  ],
};

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15_000,
  married: 30_000,
};

function taxFromBrackets(taxableIncome: number, brackets: Bracket[]): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= lower) break;
    const upperBoundInBracket = Math.min(taxableIncome, bracket.upTo);
    tax += (upperBoundInBracket - lower) * bracket.rate;
    lower = bracket.upTo;
  }
  return tax;
}

export interface TaxInputs {
  filingStatus: FilingStatus;
  ordinaryIncome: number; // traditional withdrawals, pensions, taxable SS, salary
  capitalGains: number; // taxable portion of taxable-account withdrawals
  /** Inflation-adjustment multiplier applied to bracket thresholds (1 = today's dollars). */
  bracketInflationFactor?: number;
}

export interface TaxResult {
  totalTax: number;
  ordinaryTax: number;
  capitalGainsTax: number;
  marginalOrdinaryRate: number;
  taxableOrdinaryIncome: number;
}

export function estimateFederalTax(inputs: TaxInputs): TaxResult {
  const factor = inputs.bracketInflationFactor ?? 1;
  const deduction = STANDARD_DEDUCTION[inputs.filingStatus] * factor;
  const ordinaryBrackets = ORDINARY_BRACKETS[inputs.filingStatus].map((b) => ({
    rate: b.rate,
    upTo: b.upTo === Infinity ? Infinity : b.upTo * factor,
  }));
  const ltcgBrackets = LTCG_BRACKETS[inputs.filingStatus].map((b) => ({
    rate: b.rate,
    upTo: b.upTo === Infinity ? Infinity : b.upTo * factor,
  }));

  const taxableOrdinaryIncome = Math.max(
    0,
    inputs.ordinaryIncome - deduction
  );
  const ordinaryTax = taxFromBrackets(taxableOrdinaryIncome, ordinaryBrackets);

  // Capital gains stack on top of ordinary income for bracket purposes.
  const gainsStart = taxableOrdinaryIncome;
  const gainsEnd = taxableOrdinaryIncome + Math.max(0, inputs.capitalGains);
  const capitalGainsTax =
    taxFromBrackets(gainsEnd, ltcgBrackets) -
    taxFromBrackets(gainsStart, ltcgBrackets);

  const marginalBracket = ordinaryBrackets.find(
    (b) => taxableOrdinaryIncome <= b.upTo
  );

  return {
    totalTax: ordinaryTax + capitalGainsTax,
    ordinaryTax,
    capitalGainsTax,
    marginalOrdinaryRate: marginalBracket?.rate ?? ordinaryBrackets.at(-1)!.rate,
    taxableOrdinaryIncome,
  };
}

/** Taxable income at which the given ordinary bracket rate begins to apply (top of the prior bracket). */
export function bracketCeiling(
  filingStatus: FilingStatus,
  rate: number,
  bracketInflationFactor = 1
): number {
  const brackets = ORDINARY_BRACKETS[filingStatus];
  const bracket = brackets.find((b) => b.rate === rate);
  if (!bracket) return Infinity;
  return bracket.upTo === Infinity ? Infinity : bracket.upTo * bracketInflationFactor;
}

/**
 * Simplified IRS Uniform Lifetime Table (Table III), used to estimate
 * required minimum distributions starting at age 73.
 */
const RMD_UNIFORM_LIFETIME: Record<number, number> = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2,
  87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1,
  94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4,
};

export const RMD_START_AGE = 73;

export function rmdDivisor(age: number): number | undefined {
  if (age < RMD_START_AGE) return undefined;
  const clampedAge = Math.min(age, 100);
  return RMD_UNIFORM_LIFETIME[clampedAge];
}
