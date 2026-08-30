"use client";

import Link from "next/link";
import { useActiveHousehold, useMonteCarlo, useProjection } from "@/lib/hooks";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { CompositionChart } from "@/components/charts/CompositionChart";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function DashboardPage() {
  const [household] = useActiveHousehold();
  const projection = useProjection(household);
  const monteCarlo = useMonteCarlo(household);

  const currentNetWorth = household.accounts.reduce((s, a) => s + a.balance, 0);
  const retirementYearIndex = Math.max(
    0,
    household.primary.retirementAge - household.primary.currentAge
  );
  const balanceAtRetirement =
    projection.years[retirementYearIndex]?.totalBalance ?? currentNetWorth;

  const successStatus =
    monteCarlo.successRate >= 0.85
      ? "good"
      : monteCarlo.successRate >= 0.6
        ? "warning"
        : "critical";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {household.primary.name && household.primary.name !== "You"
              ? `${household.primary.name}'s plan`
              : "Your plan"}
          </h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Retiring at {household.primary.retirementAge}, planning through age{" "}
            {household.primary.lifeExpectancy}.
          </p>
        </div>
        <Link
          href="/profile"
          className="text-sm font-medium rounded-full border px-4 py-2 shrink-0"
          style={{ background: "var(--surface-2)" }}
        >
          Edit your plan
        </Link>
      </div>

      {projection.depletionYear && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}
        >
          In your expected-return projection, this plan runs out of money in{" "}
          {projection.depletionYear} (age{" "}
          {projection.years.find((y) => y.year === projection.depletionYear)?.primaryAge}).
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Current net worth" value={formatCurrency(currentNetWorth)} />
        <StatTile
          label="Projected at retirement"
          value={formatCurrency(balanceAtRetirement)}
          hint="Expected-return path"
        />
        <StatTile
          label="Plan success rate"
          value={formatPercent(monteCarlo.successRate, 0)}
          hint={`${monteCarlo.runs.toLocaleString()} market simulations`}
          status={successStatus}
        />
        <StatTile
          label="Median ending balance"
          value={formatCurrency(monteCarlo.medianFinalBalance, { compact: true })}
          hint={`At age ${household.primary.lifeExpectancy}`}
        />
      </div>

      <Card
        title="Retirement projection"
        subtitle="Range of outcomes across simulated markets, in today's dollars."
      >
        <ProjectionChart
          monteCarlo={monteCarlo}
          deterministic={projection}
          retirementAge={household.primary.retirementAge}
        />
      </Card>

      <Card
        title="Net worth composition"
        subtitle="Expected-return path by account type — where your money is, over time."
      >
        <CompositionChart projection={projection} retirementAge={household.primary.retirementAge} />
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/roth-conversion" className="block">
          <Card className="h-full hover:opacity-90 transition-opacity" title="Roth conversion planner" subtitle="See if converting traditional dollars to Roth lowers your lifetime taxes.">
            <span className="text-sm font-medium" style={{ color: "var(--series-1)" }}>
              Explore →
            </span>
          </Card>
        </Link>
        <Link href="/fire" className="block">
          <Card className="h-full hover:opacity-90 transition-opacity" title="FIRE tools" subtitle="Coast FIRE and Barista FIRE calculators for retiring earlier.">
            <span className="text-sm font-medium" style={{ color: "var(--series-1)" }}>
              Explore →
            </span>
          </Card>
        </Link>
        <Link href="/scenarios" className="block">
          <Card className="h-full hover:opacity-90 transition-opacity" title="Compare scenarios" subtitle="Retire earlier? Spend more? Line up plans side by side.">
            <span className="text-sm font-medium" style={{ color: "var(--series-1)" }}>
              Explore →
            </span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
