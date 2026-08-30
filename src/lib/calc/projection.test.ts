import { describe, expect, it } from "vitest";
import { projectHousehold } from "@/lib/calc/projection";
import { createDefaultHousehold } from "@/lib/defaults";
import type { Household } from "@/lib/types";

describe("projectHousehold", () => {
  it("grows accounts during accumulation and stops at retirement age", () => {
    const household = createDefaultHousehold();
    const result = projectHousehold(household);
    const firstYear = result.years[0];
    expect(firstYear.phase).toBe("accumulation");
    expect(firstYear.totalBalance).toBeGreaterThan(
      household.accounts.reduce((s, a) => s + a.balance, 0)
    );

    const retirementYearIndex =
      household.primary.retirementAge - household.primary.currentAge;
    expect(result.years[retirementYearIndex].phase).toBe("retirement");
    expect(result.years[retirementYearIndex - 1].phase).toBe("accumulation");
  });

  it("produces one row per year of the plan", () => {
    const household = createDefaultHousehold();
    const result = projectHousehold(household);
    const expectedYears =
      household.primary.lifeExpectancy - household.primary.currentAge + 1;
    expect(result.years).toHaveLength(expectedYears);
  });

  it("depletes a portfolio that can't support spending", () => {
    const household = createDefaultHousehold();
    household.assumptions.annualRetirementSpending = 10_000_000;
    household.primary.retirementAge = household.primary.currentAge; // retire immediately
    const result = projectHousehold(household);
    expect(result.depletionYear).toBeDefined();
    expect(result.finalBalance).toBeLessThan(1);
  });

  it("never depletes a portfolio that vastly exceeds spending needs", () => {
    const household = createDefaultHousehold();
    household.accounts.forEach((a) => (a.balance = 50_000_000));
    household.assumptions.annualRetirementSpending = 20_000;
    const result = projectHousehold(household);
    expect(result.depletionYear).toBeUndefined();
    expect(result.finalBalance).toBeGreaterThan(0);
  });

  it("withdraws from accounts in the configured order", () => {
    const household: Household = createDefaultHousehold();
    household.primary.currentAge = 65;
    household.primary.retirementAge = 65;
    household.primary.lifeExpectancy = 66;
    household.assumptions.withdrawalOrder = ["taxable", "traditional", "roth"];
    household.assumptions.annualRetirementSpending = 10_000;
    household.assumptions.healthcareBridgeAnnual = 0;
    household.incomeSources = [];
    household.accounts = [
      {
        ...household.accounts[0],
        type: "taxable",
        balance: 5_000,
        annualContribution: 0,
        employerMatch: 0,
      },
      {
        ...household.accounts[1],
        type: "traditional",
        balance: 50_000,
        annualContribution: 0,
        employerMatch: 0,
      },
    ];
    const result = projectHousehold(household);
    const retirementYear = result.years[0];
    const taxable = retirementYear.accounts.find((a) => a.type === "taxable")!;
    const traditional = retirementYear.accounts.find(
      (a) => a.type === "traditional"
    )!;
    // Taxable (5,000) should be drained first, then the remainder from traditional.
    expect(taxable.withdrawals).toBeCloseTo(5_000, 0);
    expect(traditional.withdrawals).toBeGreaterThan(0);
    expect(traditional.withdrawals).toBeCloseTo(5_000, 0);
  });

  it("actually withdraws enough from the portfolio to cover taxes owed", () => {
    const household: Household = createDefaultHousehold();
    household.primary.currentAge = 65;
    household.primary.retirementAge = 65;
    household.primary.lifeExpectancy = 66;
    household.incomeSources = [];
    household.oneTimeItems = [];
    household.assumptions.healthcareBridgeAnnual = 0;
    household.assumptions.annualRetirementSpending = 80_000;
    household.assumptions.withdrawalOrder = ["traditional"];
    household.accounts = [
      {
        ...household.accounts[0],
        type: "traditional",
        balance: 2_000_000,
        annualContribution: 0,
        employerMatch: 0,
        expectedReturn: 0,
      },
    ];
    const result = projectHousehold(household);
    const year = result.years[0];
    expect(year.taxesPaid).toBeGreaterThan(0);
    // The portfolio must fund spending AND the tax bill on that withdrawal,
    // so gross withdrawal should exceed the spending need alone.
    expect(year.grossWithdrawal).toBeGreaterThan(year.spendingNeed);
    expect(year.grossWithdrawal).toBeCloseTo(
      household.assumptions.annualRetirementSpending + year.taxesPaid,
      0
    );
  });

  it("stops growing salary-like contributions after retirement", () => {
    const household = createDefaultHousehold();
    const result = projectHousehold(household);
    const retirementYearIndex =
      household.primary.retirementAge - household.primary.currentAge;
    const retirementYear = result.years[retirementYearIndex];
    for (const account of retirementYear.accounts) {
      expect(account.contributions).toBe(0);
    }
  });
});
