import type { Household } from "@/lib/types";
import { generateId } from "@/lib/id";

export function createDefaultHousehold(): Household {
  const currentYear = new Date().getFullYear();
  return {
    primary: {
      name: "You",
      currentAge: 35,
      retirementAge: 65,
      lifeExpectancy: 95,
    },
    accounts: [
      {
        id: generateId(),
        name: "401(k)",
        type: "traditional",
        owner: "primary",
        balance: 80_000,
        annualContribution: 12_000,
        employerMatch: 4_000,
        expectedReturn: 0.05,
        returnStdDev: 0.15,
      },
      {
        id: generateId(),
        name: "Roth IRA",
        type: "roth",
        owner: "primary",
        balance: 20_000,
        annualContribution: 7_000,
        employerMatch: 0,
        expectedReturn: 0.05,
        returnStdDev: 0.15,
      },
      {
        id: generateId(),
        name: "Brokerage",
        type: "taxable",
        owner: "primary",
        balance: 25_000,
        annualContribution: 6_000,
        employerMatch: 0,
        expectedReturn: 0.045,
        returnStdDev: 0.14,
      },
    ],
    incomeSources: [
      {
        id: generateId(),
        name: "Social Security",
        type: "socialSecurity",
        owner: "primary",
        annualAmount: 24_000,
        startAge: 67,
        colaPct: 0,
      },
    ],
    lifeEvents: [],
    assumptions: {
      currentYear,
      filingStatus: "single",
      inflationRate: 0.03,
      annualRetirementSpending: 60_000,
      healthcareBridgeAnnual: 8_000,
      withdrawalStrategy: "fixedReal",
      withdrawalOrder: ["taxable", "traditional", "roth"],
      taxableGainFraction: 0.3,
      monteCarloRuns: 500,
    },
  };
}
