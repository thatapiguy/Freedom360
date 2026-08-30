import type {
  Household,
  MonteCarloResult,
  MonteCarloYearBand,
} from "@/lib/types";
import { projectHousehold } from "@/lib/calc/projection";

/** Simple deterministic PRNG (mulberry32) so results are reproducible for a given seed. */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomNormal(random: () => number): number {
  // Box-Muller transform.
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function runMonteCarlo(
  household: Household,
  runs: number = household.assumptions.monteCarloRuns,
  seed = 42
): MonteCarloResult {
  const random = mulberry32(seed);
  const totalYears =
    household.primary.lifeExpectancy - household.primary.currentAge + 1;

  const balancesByYear: number[][] = Array.from({ length: totalYears }, () => []);
  let successes = 0;
  const finalBalances: number[] = [];

  for (let run = 0; run < runs; run++) {
    const yearShocks = Array.from({ length: totalYears }, () =>
      randomNormal(random)
    );
    const result = projectHousehold(household, {
      returnForYear: (account, yearIndex) => {
        const shock = yearShocks[yearIndex] ?? 0;
        const rate = account.expectedReturn + shock * account.returnStdDev;
        return Math.max(rate, -0.95);
      },
    });

    result.years.forEach((y, i) => {
      balancesByYear[i]?.push(y.totalBalance);
    });
    if (result.depletionYear === undefined) successes++;
    finalBalances.push(result.finalBalance);
  }

  const bands: MonteCarloYearBand[] = [];
  for (let i = 0; i < totalYears; i++) {
    const sorted = [...balancesByYear[i]].sort((a, b) => a - b);
    bands.push({
      year: household.assumptions.currentYear + i,
      age: household.primary.currentAge + i,
      p10: percentile(sorted, 0.1),
      p25: percentile(sorted, 0.25),
      p50: percentile(sorted, 0.5),
      p75: percentile(sorted, 0.75),
      p90: percentile(sorted, 0.9),
    });
  }

  const sortedFinal = [...finalBalances].sort((a, b) => a - b);

  return {
    successRate: runs > 0 ? successes / runs : 0,
    bands,
    runs,
    medianFinalBalance: percentile(sortedFinal, 0.5),
  };
}
