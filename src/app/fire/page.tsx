"use client";

import { useMemo, useState } from "react";
import { useActiveHousehold } from "@/lib/hooks";
import { computeCoastFire } from "@/lib/calc/fire";
import { projectHousehold } from "@/lib/calc/projection";
import { runMonteCarlo } from "@/lib/calc/montecarlo";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { NumberField } from "@/components/ui/fields";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { IncomeSource } from "@/lib/types";

export default function FirePage() {
  const [household] = useActiveHousehold();
  const householdKey = JSON.stringify(household);

  const [swr, setSwr] = useState(0.04);
  const coastFire = useMemo(
    () => computeCoastFire(household, swr),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [householdKey, swr]
  );

  const [semiRetirementAge, setSemiRetirementAge] = useState(
    Math.max(household.primary.currentAge + 5, household.primary.retirementAge - 10)
  );
  const [partTimeIncome, setPartTimeIncome] = useState(20_000);
  const [partTimeEndAge, setPartTimeEndAge] = useState(household.primary.retirementAge);

  const baristaHousehold = useMemo(() => {
    const partTimeIncomeSource: IncomeSource = {
      id: "barista-preview",
      name: "Part-time income",
      type: "other",
      owner: "primary",
      annualAmount: partTimeIncome,
      startAge: semiRetirementAge,
      endAge: partTimeEndAge,
      colaPct: 0,
    };
    return {
      ...household,
      primary: { ...household.primary, retirementAge: semiRetirementAge },
      incomeSources: [...household.incomeSources, partTimeIncomeSource],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdKey, semiRetirementAge, partTimeIncome, partTimeEndAge]);
  const baristaHouseholdKey = JSON.stringify(baristaHousehold);

  const baristaProjection = useMemo(
    () => projectHousehold(baristaHousehold),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baristaHouseholdKey]
  );
  const baristaMonteCarlo = useMemo(
    () => runMonteCarlo(baristaHousehold),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baristaHouseholdKey]
  );

  const baristaSuccessStatus =
    baristaMonteCarlo.successRate >= 0.85 ? "good" : baristaMonteCarlo.successRate >= 0.6 ? "warning" : "critical";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">FIRE tools</h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          For anyone aiming to retire well before a traditional retirement age.
        </p>
      </div>

      <Card
        title="Coast FIRE"
        subtitle="If your current savings alone — with no more contributions — will grow to your FIRE number by your planned retirement age, you're 'coast FI': saving more becomes optional."
      >
        <div className="max-w-xs mb-4">
          <NumberField
            label="Safe withdrawal rate"
            value={swr * 100}
            min={2}
            max={6}
            step={0.25}
            suffix="%"
            onCommit={(v) => setSwr(v / 100)}
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="FIRE number" value={formatCurrency(coastFire.fireNumber, { compact: true })} hint={`${formatCurrency(coastFire.annualSpending)}/yr ÷ ${formatPercent(swr, 1)}`} />
          <StatTile
            label="Coast number today"
            value={formatCurrency(coastFire.coastNumberToday, { compact: true })}
            hint={`Grown at ${formatPercent(coastFire.assumedAnnualReturn, 1)}/yr for ${coastFire.yearsToTraditionalRetirement} yrs`}
          />
          <StatTile label="Currently invested" value={formatCurrency(coastFire.currentInvestedTotal, { compact: true })} />
          <StatTile
            label={coastFire.isCoastFI ? "You're coast FI" : "Gap to coast FI"}
            value={coastFire.isCoastFI ? "Yes" : formatCurrency(coastFire.gapToCoast, { compact: true })}
            status={coastFire.isCoastFI ? "good" : "warning"}
          />
        </div>
      </Card>

      <Card
        title="Barista FIRE"
        subtitle="Retire earlier by covering part of your spending with part-time or lower-stress work, letting your portfolio fund only the gap."
      >
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <NumberField
            label="Semi-retirement age"
            value={semiRetirementAge}
            min={household.primary.currentAge}
            max={household.primary.retirementAge}
            onCommit={setSemiRetirementAge}
          />
          <NumberField
            label="Part-time income"
            value={partTimeIncome}
            min={0}
            step={1000}
            onCommit={setPartTimeIncome}
          />
          <NumberField
            label="Part-time income ends at age"
            value={partTimeEndAge}
            min={semiRetirementAge}
            max={household.primary.lifeExpectancy}
            onCommit={setPartTimeEndAge}
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <StatTile
            label="Plan success rate"
            value={formatPercent(baristaMonteCarlo.successRate, 0)}
            status={baristaSuccessStatus}
            hint={`${baristaMonteCarlo.runs.toLocaleString()} simulations`}
          />
          <StatTile
            label="Balance at full retirement"
            value={formatCurrency(
              baristaProjection.years.find((y) => y.primaryAge === partTimeEndAge)?.totalBalance ?? 0,
              { compact: true }
            )}
          />
          <StatTile
            label="Runs out?"
            value={baristaProjection.depletionYear ? `Yes, ${baristaProjection.depletionYear}` : "No"}
            status={baristaProjection.depletionYear ? "critical" : "good"}
          />
        </div>
        <p className="text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
          This preview retires you at your semi-retirement age and layers in the
          part-time income above — it doesn&apos;t change your saved plan. Like it?
          Duplicate your plan from the Compare scenarios page and adjust retirement
          age and income there to keep it.
        </p>
      </Card>
    </div>
  );
}
