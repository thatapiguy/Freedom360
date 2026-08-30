import type { WithdrawalStrategy } from "@/lib/types";

/**
 * All amounts here are in real (today's) dollars — the whole projection
 * engine works in real terms, so "grows with inflation" simply means the
 * amount stays flat year over year.
 *
 * `targetGap` is the naive flat-spending gap for the year: desired
 * lifestyle spending (incl. any healthcare bridge / one-time item) minus
 * guaranteed income (Social Security, pension, rental, etc.). It is
 * recomputed every year so a withdrawal strategy naturally responds when
 * guaranteed income starts, changes, or a one-time expense hits — the
 * strategy then decides how much of that gap to actually withdraw.
 */
export interface WithdrawalContext {
  strategy: WithdrawalStrategy;
  yearsIntoRetirement: number;
  /** Total portfolio balance at the start of this year, before this year's withdrawal. */
  portfolioBalanceStart: number;
  /** This year's naive spending-minus-guaranteed-income gap. */
  targetGap: number;
  /** targetGap in the first year of retirement divided by the portfolio balance at retirement. */
  initialGapRate: number;
  /** Running Guyton-Klinger adjustment factor carried from the previous year (1.0 at retirement). */
  adjustmentFactor: number;
  primaryAge: number;
  lifeExpectancy: number;
}

export interface WithdrawalOutcome {
  amount: number;
  nextAdjustmentFactor: number;
}

const GUARDRAIL_BAND = 0.2; // Guyton-Klinger's +/-20% guardrail
const GUARDRAIL_ADJUSTMENT = 0.1; // 10% spending cut/raise when a guardrail is breached

export function computeWithdrawal(ctx: WithdrawalContext): WithdrawalOutcome {
  const targetGap = Math.max(0, ctx.targetGap);

  if (ctx.yearsIntoRetirement === 0 || ctx.portfolioBalanceStart <= 0) {
    return { amount: targetGap, nextAdjustmentFactor: 1 };
  }

  switch (ctx.strategy) {
    case "fixedReal":
      return { amount: targetGap, nextAdjustmentFactor: 1 };

    case "guytonKlinger": {
      let factor = ctx.adjustmentFactor;
      const provisional = factor * targetGap;
      const currentRate =
        ctx.portfolioBalanceStart > 0
          ? provisional / ctx.portfolioBalanceStart
          : Infinity;

      if (currentRate > ctx.initialGapRate * (1 + GUARDRAIL_BAND)) {
        factor *= 1 - GUARDRAIL_ADJUSTMENT;
      } else if (currentRate < ctx.initialGapRate * (1 - GUARDRAIL_BAND)) {
        factor *= 1 + GUARDRAIL_ADJUSTMENT;
      }
      return { amount: factor * targetGap, nextAdjustmentFactor: factor };
    }

    case "vpw": {
      const yearsRemaining = Math.max(
        1,
        ctx.lifeExpectancy - ctx.primaryAge + 1
      );
      return {
        amount: ctx.portfolioBalanceStart / yearsRemaining,
        nextAdjustmentFactor: 1,
      };
    }

    default:
      return { amount: targetGap, nextAdjustmentFactor: 1 };
  }
}

export const WITHDRAWAL_STRATEGY_LABELS: Record<WithdrawalStrategy, string> = {
  fixedReal: "Fixed real spending (4%-rule style)",
  guytonKlinger: "Guyton-Klinger guardrails",
  vpw: "Variable percentage (amortization-based)",
};

export const WITHDRAWAL_STRATEGY_DESCRIPTIONS: Record<
  WithdrawalStrategy,
  string
> = {
  fixedReal:
    "Withdraw the same inflation-adjusted amount every year, regardless of market performance. Simple and predictable, but doesn't respond to bad markets — the classic '4% rule'.",
  guytonKlinger:
    "Start with a target withdrawal rate. Cut spending 10% if a bad market pushes your withdrawal rate 20% above target; raise spending 10% if strong markets push it 20% below target. Smooths out sequence-of-returns risk.",
  vpw:
    "Withdraw a percentage of your current balance based on years of retirement remaining, similar to how RMDs work. Spending moves with the portfolio, so you're very unlikely to run out of money, but income can vary year to year.",
};
