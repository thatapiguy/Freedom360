import type {
  Account,
  AccountType,
  AccountYearBreakdown,
  Household,
  ProjectionResult,
  YearResult,
} from "@/lib/types";
import { estimateFederalTax, rmdDivisor } from "@/lib/calc/tax";
import { computeWithdrawal } from "@/lib/calc/withdrawal";
import { computeLifeEventTotals } from "@/lib/calc/lifeEvents";

export interface ProjectionOptions {
  /** Return a real annual return for this account on this year index (0-based from currentYear). Falls back to account.expectedReturn. */
  returnForYear?: (account: Account, yearIndex: number) => number;
  /** Override the primary's retirement age (used by FIRE calculators). */
  retirementAgeOverride?: number;
  /** Extra one-time income sources not stored on the household (used by Barista FIRE). */
  extraIncomeSources?: Household["incomeSources"];
}

const MEDICARE_AGE = 65;

function ageInYear(startAge: number, yearIndex: number): number {
  return startAge + yearIndex;
}

function incomeValueForYear(
  source: Household["incomeSources"][number],
  ownerAge: number,
  yearIndex: number
): number {
  const active =
    ownerAge >= source.startAge &&
    (source.endAge === undefined || ownerAge <= source.endAge);
  if (!active) return 0;
  return source.annualAmount * Math.pow(1 + source.colaPct, yearIndex);
}

function computeGuaranteedIncome(
  household: Household,
  yearIndex: number,
  primaryAge: number,
  spouseAge: number | undefined,
  extraIncomeSources: Household["incomeSources"]
): number {
  const allSources = [...household.incomeSources, ...extraIncomeSources];
  let total = 0;
  for (const source of allSources) {
    const ownerAge = source.owner === "spouse" ? spouseAge : primaryAge;
    if (ownerAge === undefined) continue;
    total += incomeValueForYear(source, ownerAge, yearIndex);
  }
  return total;
}

interface AccountState {
  account: Account;
  balance: number;
}

export function projectHousehold(
  household: Household,
  options: ProjectionOptions = {}
): ProjectionResult {
  const { primary, spouse, assumptions } = household;
  const retirementAge = options.retirementAgeOverride ?? primary.retirementAge;
  const extraIncomeSources = options.extraIncomeSources ?? [];
  const totalYears = primary.lifeExpectancy - primary.currentAge + 1;

  const accountStates: AccountState[] = household.accounts.map((account) => ({
    account,
    balance: account.balance,
  }));

  const years: YearResult[] = [];
  let depletionYear: number | undefined;

  // Guyton-Klinger running state.
  let gkAdjustmentFactor = 1;
  let initialGapRate = 0;
  let initialWithdrawal = 0;
  let initialPortfolioBalance = 0;

  for (let yearIndex = 0; yearIndex < totalYears; yearIndex++) {
    const primaryAge = ageInYear(primary.currentAge, yearIndex);
    const spouseAge = spouse
      ? ageInYear(spouse.currentAge, yearIndex)
      : undefined;
    const year = assumptions.currentYear + yearIndex;
    const phase: YearResult["phase"] =
      primaryAge < retirementAge ? "accumulation" : "retirement";
    const yearsIntoRetirement = primaryAge - retirementAge;

    const guaranteedIncome = computeGuaranteedIncome(
      household,
      yearIndex,
      primaryAge,
      spouseAge,
      extraIncomeSources
    );
    const lifeEventTotals = computeLifeEventTotals(
      household,
      yearIndex,
      primaryAge,
      spouseAge
    );

    const accountBreakdowns: AccountYearBreakdown[] = [];
    let totalBalanceStart = 0;
    for (const state of accountStates) totalBalanceStart += state.balance;

    let grossWithdrawal = 0;
    let spendingNeed = 0;
    let taxesPaid = 0;
    const reportedGuaranteedIncome = guaranteedIncome + lifeEventTotals.income;

    if (phase === "accumulation") {
      spendingNeed = lifeEventTotals.expense;
      // Life events before retirement (a wedding, an inheritance) aren't
      // funded by a withdrawal-order sequence — accounts are still
      // accumulating — so the net cash flow is spread across accounts in
      // proportion to their current balance, floored so no account goes
      // negative from a single year's expense.
      const lifeEventNet = lifeEventTotals.income - lifeEventTotals.expense;
      for (const state of accountStates) {
        const startBalance = state.balance;
        const contributions =
          state.account.annualContribution + state.account.employerMatch;
        const balanceShare =
          totalBalanceStart > 0 ? startBalance / totalBalanceStart : 1 / accountStates.length;
        const lifeEventShare = Math.max(lifeEventNet * balanceShare, -startBalance);
        const depositFromLifeEvent = Math.max(0, lifeEventShare);
        const withdrawalFromLifeEvent = Math.max(0, -lifeEventShare);
        const netFlow = contributions + lifeEventShare;
        const rate =
          options.returnForYear?.(state.account, yearIndex) ??
          state.account.expectedReturn;
        const growth = startBalance * rate + netFlow * rate * 0.5;
        const endBalance = Math.max(0, startBalance + netFlow + growth);
        accountBreakdowns.push({
          type: state.account.type,
          startBalance,
          contributions: contributions + depositFromLifeEvent,
          growth,
          withdrawals: withdrawalFromLifeEvent,
          endBalance,
        });
        state.balance = endBalance;
      }
    } else {
      const healthcareBridge =
        primaryAge < MEDICARE_AGE ? assumptions.healthcareBridgeAnnual : 0;
      spendingNeed =
        assumptions.annualRetirementSpending + healthcareBridge + lifeEventTotals.expense;
      const targetGap = Math.max(0, spendingNeed - reportedGuaranteedIncome);

      if (yearsIntoRetirement === 0) {
        initialWithdrawal = targetGap;
        initialPortfolioBalance = totalBalanceStart;
        initialGapRate =
          initialPortfolioBalance > 0
            ? initialWithdrawal / initialPortfolioBalance
            : 0;
        gkAdjustmentFactor = 1;
      }

      const { amount: strategyWithdrawal, nextAdjustmentFactor } =
        computeWithdrawal({
          strategy: assumptions.withdrawalStrategy,
          yearsIntoRetirement,
          portfolioBalanceStart: totalBalanceStart,
          targetGap,
          initialGapRate,
          adjustmentFactor: gkAdjustmentFactor,
          primaryAge,
          lifeExpectancy: primary.lifeExpectancy,
        });
      gkAdjustmentFactor = nextAdjustmentFactor;

      // Required minimum distributions force a minimum traditional draw.
      let rmdRequired = 0;
      if (primaryAge >= 73) {
        const divisor = rmdDivisor(primaryAge);
        if (divisor) {
          for (const state of accountStates) {
            if (state.account.type === "traditional" && state.balance > 0) {
              rmdRequired += state.balance / divisor;
            }
          }
        }
      }

      grossWithdrawal = Math.max(strategyWithdrawal, rmdRequired);
      grossWithdrawal = Math.min(grossWithdrawal, totalBalanceStart);

      const withdrawnByAccount = new Map<string, number>();
      let remaining = grossWithdrawal;

      // Step 1: satisfy RMDs out of traditional accounts first.
      if (rmdRequired > 0) {
        const traditional = accountStates.filter(
          (s) => s.account.type === "traditional" && s.balance > 0
        );
        const totalTraditional = traditional.reduce(
          (sum, s) => sum + s.balance,
          0
        );
        const rmdToTake = Math.min(rmdRequired, remaining);
        for (const state of traditional) {
          const share =
            totalTraditional > 0 ? state.balance / totalTraditional : 0;
          const amt = Math.min(state.balance, rmdToTake * share);
          withdrawnByAccount.set(
            state.account.id,
            (withdrawnByAccount.get(state.account.id) ?? 0) + amt
          );
          remaining -= amt;
        }
      }

      // Step 2: sequence the rest through the configured withdrawal order.
      const drawableBalance = (state: AccountState) =>
        state.balance - (withdrawnByAccount.get(state.account.id) ?? 0);

      const sequenceWithdrawal = (amount: number): number => {
        let left = amount;
        for (const type of assumptions.withdrawalOrder) {
          if (left <= 0.005) break;
          const ofType = accountStates.filter(
            (s) => s.account.type === type && drawableBalance(s) > 0
          );
          const totalOfType = ofType.reduce(
            (sum, s) => sum + drawableBalance(s),
            0
          );
          if (totalOfType <= 0) continue;
          const drawFromType = Math.min(left, totalOfType);
          for (const state of ofType) {
            const share = drawableBalance(state) / totalOfType;
            const amt = drawFromType * share;
            withdrawnByAccount.set(
              state.account.id,
              (withdrawnByAccount.get(state.account.id) ?? 0) + amt
            );
          }
          left -= drawFromType;
        }
        return amount - left; // actually withdrawn
      };

      const spendingWithdrawn = sequenceWithdrawal(remaining);
      remaining -= spendingWithdrawn;
      grossWithdrawal -= remaining;

      const incomeFromWithdrawals = (amounts: Map<string, number>) => {
        let ordinary = 0;
        let gains = 0;
        for (const state of accountStates) {
          const withdrawn = amounts.get(state.account.id) ?? 0;
          if (state.account.type === "traditional") {
            ordinary += withdrawn;
          } else if (state.account.type === "taxable") {
            gains += withdrawn * assumptions.taxableGainFraction;
            // roth and hsa withdrawals are untaxed in this simplified model.
          }
        }
        return { ordinary, gains };
      };

      const spendingIncome = incomeFromWithdrawals(withdrawnByAccount);
      const ordinaryIncome = reportedGuaranteedIncome + spendingIncome.ordinary;
      const capitalGains = spendingIncome.gains;

      taxesPaid = estimateFederalTax({
        filingStatus: assumptions.filingStatus,
        ordinaryIncome,
        capitalGains,
      }).totalTax;

      // Fund the tax bill from the portfolio too, via the same withdrawal
      // order, continuing where the spending withdrawal left off. We don't
      // re-tax this incremental withdrawal (a standard, minor
      // simplification) — real dollars still leave the portfolio for it.
      if (taxesPaid > 0) {
        const taxWithdrawn = sequenceWithdrawal(taxesPaid);
        grossWithdrawal += taxWithdrawn;
      }

      for (const state of accountStates) {
        const startBalance = state.balance;
        const withdrawn = withdrawnByAccount.get(state.account.id) ?? 0;
        const rate =
          options.returnForYear?.(state.account, yearIndex) ??
          state.account.expectedReturn;
        const growth = (startBalance - withdrawn * 0.5) * rate;
        const endBalance = Math.max(0, startBalance - withdrawn + growth);
        accountBreakdowns.push({
          type: state.account.type,
          startBalance,
          contributions: 0,
          growth,
          withdrawals: withdrawn,
          endBalance,
        });
        state.balance = endBalance;
      }
    }

    const totalBalanceEnd = accountBreakdowns.reduce(
      (sum, a) => sum + a.endBalance,
      0
    );
    const depleted = phase === "retirement" && totalBalanceEnd <= 0.01;
    if (depleted && depletionYear === undefined) {
      depletionYear = year;
    }

    years.push({
      year,
      primaryAge,
      spouseAge,
      phase,
      totalBalance: totalBalanceEnd,
      accounts: accountBreakdowns,
      guaranteedIncome: reportedGuaranteedIncome,
      spendingNeed,
      grossWithdrawal,
      taxesPaid,
      netCashFlow:
        reportedGuaranteedIncome + grossWithdrawal - taxesPaid - spendingNeed,
      depleted,
    });
  }

  return {
    years,
    depletionYear,
    finalBalance: years.at(-1)?.totalBalance ?? 0,
  };
}

export function totalBalanceByType(
  result: ProjectionResult
): Record<AccountType, number> {
  const last = result.years.at(-1);
  const totals: Record<AccountType, number> = {
    taxable: 0,
    traditional: 0,
    roth: 0,
    hsa: 0,
  };
  if (!last) return totals;
  for (const a of last.accounts) {
    totals[a.type] += a.endBalance;
  }
  return totals;
}
