import { describe, expect, it } from "vitest";
import { estimateFederalTax, rmdDivisor } from "@/lib/calc/tax";

describe("estimateFederalTax", () => {
  it("returns zero tax below the standard deduction", () => {
    const result = estimateFederalTax({
      filingStatus: "single",
      ordinaryIncome: 10_000,
      capitalGains: 0,
    });
    expect(result.totalTax).toBe(0);
  });

  it("taxes ordinary income progressively", () => {
    const result = estimateFederalTax({
      filingStatus: "single",
      ordinaryIncome: 100_000,
      capitalGains: 0,
    });
    expect(result.ordinaryTax).toBeGreaterThan(0);
    expect(result.marginalOrdinaryRate).toBeGreaterThanOrEqual(0.22);
  });

  it("married filing status has a higher zero-tax threshold than single", () => {
    const single = estimateFederalTax({
      filingStatus: "single",
      ordinaryIncome: 40_000,
      capitalGains: 0,
    });
    const married = estimateFederalTax({
      filingStatus: "married",
      ordinaryIncome: 40_000,
      capitalGains: 0,
    });
    expect(married.totalTax).toBeLessThanOrEqual(single.totalTax);
  });
});

describe("rmdDivisor", () => {
  it("is undefined before RMD age", () => {
    expect(rmdDivisor(70)).toBeUndefined();
  });

  it("returns a divisor at and after RMD age", () => {
    expect(rmdDivisor(73)).toBeCloseTo(26.5);
    expect(rmdDivisor(85)).toBeCloseTo(16.0);
  });
});
