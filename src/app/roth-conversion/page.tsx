"use client";

import { useMemo, useState } from "react";
import { useActiveHousehold } from "@/lib/hooks";
import { compareRothConversionStrategy, suggestBracketFillConversions } from "@/lib/calc/rothConversion";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { NumberField, SelectField } from "@/components/ui/fields";
import { formatCurrency } from "@/lib/format";

const BRACKET_OPTIONS = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35].map((rate) => ({
  value: String(rate),
  label: `${(rate * 100).toFixed(0)}% bracket`,
}));

export default function RothConversionPage() {
  const [household] = useActiveHousehold();
  const householdKey = JSON.stringify(household);
  const [conversionAmount, setConversionAmount] = useState(20_000);
  const [startAge, setStartAge] = useState(household.primary.currentAge);
  const [endAge, setEndAge] = useState(Math.max(household.primary.currentAge, household.primary.retirementAge - 1));
  const [targetBracket, setTargetBracket] = useState("0.22");

  const comparison = useMemo(
    () => compareRothConversionStrategy(household, conversionAmount, startAge, endAge),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [householdKey, conversionAmount, startAge, endAge]
  );

  const suggestions = useMemo(
    () => suggestBracketFillConversions(household, Number(targetBracket), startAge, endAge),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [householdKey, targetBracket, startAge, endAge]
  );

  const taxDelta =
    comparison.withConversions.lifetimeTaxesPaid - comparison.withoutConversions.lifetimeTaxesPaid;
  const balanceDelta =
    comparison.withConversions.finalBalance - comparison.withoutConversions.finalBalance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roth conversion planner</h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          Converting traditional dollars to Roth means paying tax now, at today&apos;s
          rate, to avoid a potentially higher rate later — including on required
          minimum distributions starting at 73. This tool estimates the tradeoff; it
          isn&apos;t tax advice.
        </p>
      </div>

      <Card title="Conversion plan">
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField
            label="Annual conversion amount"
            value={conversionAmount}
            min={0}
            step={1000}
            onCommit={setConversionAmount}
          />
          <NumberField
            label="Start age"
            value={startAge}
            min={household.primary.currentAge}
            max={endAge}
            onCommit={setStartAge}
          />
          <NumberField
            label="End age"
            value={endAge}
            min={startAge}
            max={household.primary.lifeExpectancy}
            onCommit={setEndAge}
          />
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Without conversions">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Lifetime taxes"
              value={formatCurrency(comparison.withoutConversions.lifetimeTaxesPaid, { compact: true })}
            />
            <StatTile
              label="Final balance"
              value={formatCurrency(comparison.withoutConversions.finalBalance, { compact: true })}
            />
          </div>
        </Card>
        <Card title="With conversions">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Lifetime taxes"
              value={formatCurrency(comparison.withConversions.lifetimeTaxesPaid, { compact: true })}
            />
            <StatTile
              label="Final balance"
              value={formatCurrency(comparison.withConversions.finalBalance, { compact: true })}
            />
          </div>
        </Card>
      </div>

      <Card
        title="Net effect"
        subtitle="Both scenarios assume flat, inflation-adjusted spending so the comparison isolates the conversion effect — figures here are a planning estimate, not the same model as your dashboard projection."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <StatTile
            label="Lifetime tax difference"
            value={`${taxDelta >= 0 ? "+" : ""}${formatCurrency(taxDelta, { compact: true })}`}
            status={taxDelta <= 0 ? "good" : "warning"}
            hint={taxDelta <= 0 ? "Conversions saved you taxes over your lifetime" : "Conversions cost more than they saved"}
          />
          <StatTile
            label="Final balance difference"
            value={`${balanceDelta >= 0 ? "+" : ""}${formatCurrency(balanceDelta, { compact: true })}`}
            status={balanceDelta >= 0 ? "good" : "warning"}
          />
        </div>
      </Card>

      <Card
        title="Bracket-fill suggestions"
        subtitle="A common strategy: convert just enough each year to use up your target tax bracket without spilling into the next one. This ignores other income you might have, so treat it as a starting point."
      >
        <div className="max-w-xs mb-4">
          <SelectField label="Target bracket" value={targetBracket} onChange={setTargetBracket} options={BRACKET_OPTIONS} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: "var(--text-muted)" }}>
                <th className="font-medium py-1.5 pr-4">Age</th>
                <th className="font-medium py-1.5">Suggested conversion</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((row) => (
                <tr key={row.age} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                  <td className="py-1.5 pr-4 tabular-nums">{row.age}</td>
                  <td className="py-1.5 tabular-nums">
                    {Number.isFinite(row.suggestedConversion)
                      ? formatCurrency(row.suggestedConversion)
                      : "No limit (top bracket)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
