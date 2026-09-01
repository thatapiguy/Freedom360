import type { Account, AccountType, Household } from "@/lib/types";
import { bracketCeiling, estimateFederalTax, rmdDivisor } from "@/lib/calc/tax";
import { computeLifeEventTotals } from "@/lib/calc/lifeEvents";

/**
 * The Roth-conversion analysis below runs its own simplified, aggregated
 * (bucket-per-account-type, rather than per-account) simulation. This
 * keeps the "with conversions" and "without conversions" runs perfectly
 * apples-to-apples so the only difference between them is the conversion
 * strategy — but it means the dollar figures here are a planning estimate,
 * not a re-statement of the main dashboard projection (which uses your
 * chosen withdrawal strategy and per-account returns). It also always
 * assumes flat, inflation-adjusted spending in retirement so that dynamic
 * withdrawal-strategy noise doesn't obscure the conversion effect. Life
 * events are folded in using the same bucket-proportional approach as the
 * main engine's accumulation phase (see lifeEvents.ts).
 */

const MEDICARE_AGE = 65;
const RMD_START_AGE = 73;

type Buckets = Record<AccountType, number>;

function emptyBuckets(): Buckets {
  return { taxable: 0, traditional: 0, roth: 0, hsa: 0 };
}

function bucketsFromAccounts(accounts: Account[]): Buckets {
  const buckets = emptyBuckets();
  for (const a of accounts) buckets[a.type] += a.balance;
  return buckets;
}

function blendedReturn(accounts: Account[], type: AccountType): number {
  const ofType = accounts.filter((a) => a.type === type);
  const pool = ofType.length > 0 ? ofType : accounts;
  const totalBalance = pool.reduce((sum, a) => sum + a.balance, 0);
  if (totalBalance <= 0) {
    return pool.reduce((sum, a) => sum + a.expectedReturn, 0) / (pool.length || 1);
  }
  return pool.reduce(
    (sum, a) => sum + a.expectedReturn * (a.balance / totalBalance),
    0
  );
}

function contributionsForType(accounts: Account[], type: AccountType): number {
  return accounts
    .filter((a) => a.type === type)
    .reduce((sum, a) => sum + a.annualContribution + a.employerMatch, 0);
}

function guaranteedIncomeForYear(
  household: Household,
  yearIndex: number,
  primaryAge: number,
  spouseAge: number | undefined
): number {
  let total = 0;
  for (const source of household.incomeSources) {
    const ownerAge = source.owner === "spouse" ? spouseAge : primaryAge;
    if (ownerAge === undefined) continue;
    const active =
      ownerAge >= source.startAge &&
      (source.endAge === undefined || ownerAge <= source.endAge);
    if (!active) continue;
    total += source.annualAmount * Math.pow(1 + source.colaPct, yearIndex);
  }
  return total;
}

export interface ConversionYearResult {
  age: number;
  year: number;
  conversionAmount: number;
  taxesPaid: number;
  totalBalance: number;
}

export interface ConversionSimulationResult {
  years: ConversionYearResult[];
  finalBalance: number;
  lifetimeTaxesPaid: number;
  totalConversionTax: number;
}

function simulate(
  household: Household,
  annualConversionAmount: number,
  startAge: number,
  endAge: number
): ConversionSimulationResult {
  const { primary, spouse, assumptions, accounts } = household;
  const retirementAge = primary.retirementAge;
  const totalYears = primary.lifeExpectancy - primary.currentAge + 1;

  const buckets = bucketsFromAccounts(accounts);
  const returns: Record<AccountType, number> = {
    taxable: blendedReturn(accounts, "taxable"),
    traditional: blendedReturn(accounts, "traditional"),
    roth: blendedReturn(accounts, "roth"),
    hsa: blendedReturn(accounts, "hsa"),
  };
  const contributions: Record<AccountType, number> = {
    taxable: contributionsForType(accounts, "taxable"),
    traditional: contributionsForType(accounts, "traditional"),
    roth: contributionsForType(accounts, "roth"),
    hsa: contributionsForType(accounts, "hsa"),
  };

  const years: ConversionYearResult[] = [];
  let lifetimeTaxesPaid = 0;
  let totalConversionTax = 0;

  for (let yearIndex = 0; yearIndex < totalYears; yearIndex++) {
    const age = primary.currentAge + yearIndex;
    const spouseAge = spouse ? spouse.currentAge + yearIndex : undefined;
    const year = assumptions.currentYear + yearIndex;
    const isRetired = age >= retirementAge;

    const conversionAmount =
      age >= startAge && age <= endAge
        ? Math.min(annualConversionAmount, buckets.traditional)
        : 0;
    if (conversionAmount > 0) {
      buckets.traditional -= conversionAmount;
      buckets.roth += conversionAmount;
    }

    let ordinaryIncome = conversionAmount;
    let capitalGains = 0;
    let grossWithdrawal = 0;

    const lifeEventTotals = computeLifeEventTotals(household, yearIndex, age, spouseAge);

    if (!isRetired) {
      const lifeEventNet = lifeEventTotals.income - lifeEventTotals.expense;
      const totalBucketBalance = Object.values(buckets).reduce((s, v) => s + v, 0);
      for (const type of Object.keys(buckets) as AccountType[]) {
        const start = buckets[type];
        const contrib = contributions[type];
        const balanceShare =
          totalBucketBalance > 0 ? start / totalBucketBalance : 0.25;
        const lifeEventShare = Math.max(lifeEventNet * balanceShare, -start);
        const netFlow = contrib + lifeEventShare;
        const growth = start * returns[type] + netFlow * returns[type] * 0.5;
        buckets[type] = Math.max(0, start + netFlow + growth);
      }
      ordinaryIncome += lifeEventTotals.income;
    } else {
      const guaranteedIncome =
        guaranteedIncomeForYear(household, yearIndex, age, spouseAge) +
        lifeEventTotals.income;
      const healthcareBridge =
        age < MEDICARE_AGE ? assumptions.healthcareBridgeAnnual : 0;
      const spendingNeed =
        assumptions.annualRetirementSpending + healthcareBridge + lifeEventTotals.expense;
      const targetGap = Math.max(0, spendingNeed - guaranteedIncome);

      const divisor = age >= RMD_START_AGE ? rmdDivisor(age) : undefined;
      const rmdRequired = divisor ? buckets.traditional / divisor : 0;

      const totalAvailable = Object.values(buckets).reduce(
        (s, v) => s + v,
        0
      );
      grossWithdrawal = Math.min(
        Math.max(targetGap, rmdRequired),
        totalAvailable
      );

      const withdrawnByType = emptyBuckets();
      let remaining = grossWithdrawal;
      if (rmdRequired > 0) {
        const take = Math.min(rmdRequired, remaining, buckets.traditional);
        withdrawnByType.traditional += take;
        remaining -= take;
      }
      for (const type of assumptions.withdrawalOrder) {
        if (remaining <= 0.005) break;
        const available = buckets[type] - withdrawnByType[type];
        const take = Math.min(remaining, available);
        if (take <= 0) continue;
        withdrawnByType[type] += take;
        remaining -= take;
      }

      ordinaryIncome += guaranteedIncome + withdrawnByType.traditional;
      capitalGains += withdrawnByType.taxable * assumptions.taxableGainFraction;

      for (const type of Object.keys(buckets) as AccountType[]) {
        const start = buckets[type];
        const withdrawn = withdrawnByType[type];
        const growth = (start - withdrawn * 0.5) * returns[type];
        buckets[type] = Math.max(0, start - withdrawn + growth);
      }
    }

    const taxesPaid = estimateFederalTax({
      filingStatus: assumptions.filingStatus,
      ordinaryIncome,
      capitalGains,
    }).totalTax;
    lifetimeTaxesPaid += taxesPaid;
    if (conversionAmount > 0) {
      const conversionOnlyTax = estimateFederalTax({
        filingStatus: assumptions.filingStatus,
        ordinaryIncome: conversionAmount,
        capitalGains: 0,
      }).totalTax;
      totalConversionTax += conversionOnlyTax;
    }

    // Fund the tax bill from the portfolio, preferring the withdrawal
    // order, then falling back to any other bucket with a balance — taxes
    // owed always leave the portfolio, they're never simply skipped.
    let taxRemaining = taxesPaid;
    for (const type of assumptions.withdrawalOrder) {
      if (taxRemaining <= 0.005) break;
      const take = Math.min(taxRemaining, buckets[type]);
      buckets[type] -= take;
      taxRemaining -= take;
    }
    if (taxRemaining > 0.005) {
      for (const type of Object.keys(buckets) as AccountType[]) {
        if (taxRemaining <= 0.005) break;
        const take = Math.min(taxRemaining, buckets[type]);
        buckets[type] -= take;
        taxRemaining -= take;
      }
    }

    const totalBalance = Object.values(buckets).reduce((s, v) => s + v, 0);
    years.push({ age, year, conversionAmount, taxesPaid, totalBalance });
  }

  const finalBalance = years.at(-1)?.totalBalance ?? 0;
  return { years, finalBalance, lifetimeTaxesPaid, totalConversionTax };
}

export function compareRothConversionStrategy(
  household: Household,
  annualConversionAmount: number,
  startAge: number,
  endAge: number
) {
  const withoutConversions = simulate(household, 0, startAge, endAge);
  const withConversions = simulate(
    household,
    annualConversionAmount,
    startAge,
    endAge
  );
  return { withoutConversions, withConversions };
}

export interface ConversionPlanYear {
  age: number;
  year: number;
  suggestedConversion: number;
}

/**
 * Suggests, for each year in the given age range, the traditional -> Roth
 * conversion amount that "fills up" the target marginal tax bracket. This
 * ignores any other ordinary income you might have in those years — treat
 * it as a starting point, not a final answer.
 */
export function suggestBracketFillConversions(
  household: Household,
  targetBracketRate: number,
  startAge: number,
  endAge: number
): ConversionPlanYear[] {
  const ceiling = bracketCeiling(
    household.assumptions.filingStatus,
    targetBracketRate
  );
  const plan: ConversionPlanYear[] = [];
  for (let age = startAge; age <= endAge; age++) {
    const yearIndex = age - household.primary.currentAge;
    const year = household.assumptions.currentYear + yearIndex;
    plan.push({
      age,
      year,
      suggestedConversion: Number.isFinite(ceiling) ? ceiling : 0,
    });
  }
  return plan;
}
