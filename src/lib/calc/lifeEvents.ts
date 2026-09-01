import type { Household, LifeEvent } from "@/lib/types";

/** The dollar impact of a single life event in a given projection year, or 0 if inactive. */
export function lifeEventAmountForYear(
  event: LifeEvent,
  ownerAge: number,
  yearIndex: number
): number {
  if (event.timing.mode === "oneTime") {
    return ownerAge === event.timing.age ? event.amount : 0;
  }
  const { startAge, endAge, growthPct } = event.timing;
  if (ownerAge < startAge || ownerAge > endAge) return 0;
  // Grows from plan start, same convention as IncomeSource.colaPct — the
  // amount is specified in today's (plan-start) dollars.
  return event.amount * Math.pow(1 + growthPct, yearIndex);
}

/** Sums every active life event in a year into an income total and an expense total. */
export function computeLifeEventTotals(
  household: Pick<Household, "lifeEvents">,
  yearIndex: number,
  primaryAge: number,
  spouseAge: number | undefined
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const event of household.lifeEvents) {
    const ownerAge = event.owner === "spouse" ? spouseAge : primaryAge;
    if (ownerAge === undefined) continue;
    const amount = lifeEventAmountForYear(event, ownerAge, yearIndex);
    if (amount === 0) continue;
    if (event.kind === "income") income += amount;
    else expense += amount;
  }
  return { income, expense };
}
