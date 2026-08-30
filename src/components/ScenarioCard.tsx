"use client";

import { useState } from "react";
import type { Scenario } from "@/lib/types";
import { useProjection, useMonteCarlo } from "@/lib/hooks";
import { usePlannerStore } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { TextField } from "@/components/ui/fields";
import { formatCurrency, formatPercent } from "@/lib/format";
import { WITHDRAWAL_STRATEGY_LABELS } from "@/lib/calc/withdrawal";

export function ScenarioCard({ scenario, isActive }: { scenario: Scenario; isActive: boolean }) {
  const projection = useProjection(scenario.household);
  const monteCarlo = useMonteCarlo(scenario.household);
  const setActiveScenario = usePlannerStore((s) => s.setActiveScenario);
  const duplicateScenario = usePlannerStore((s) => s.duplicateScenario);
  const deleteScenario = usePlannerStore((s) => s.deleteScenario);
  const renameScenario = usePlannerStore((s) => s.renameScenario);
  const scenarioCount = usePlannerStore((s) => s.scenarios.length);
  const [editing, setEditing] = useState(false);

  const successStatus =
    monteCarlo.successRate >= 0.85 ? "good" : monteCarlo.successRate >= 0.6 ? "warning" : "critical";

  return (
    <Card className={isActive ? "ring-2 ring-[var(--series-1)]" : ""}>
      <div className="flex items-start justify-between gap-2 mb-4">
        {editing ? (
          <TextField
            value={scenario.name}
            onCommit={(name) => {
              renameScenario(scenario.id, name || scenario.name);
              setEditing(false);
            }}
          />
        ) : (
          <button className="text-left font-semibold" onClick={() => setEditing(true)} title="Rename">
            {scenario.name}
          </button>
        )}
        {isActive && (
          <span
            className="text-xs shrink-0 rounded-full px-2 py-0.5 font-medium"
            style={{ background: "var(--series-1)", color: "white" }}
          >
            Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Success rate" value={formatPercent(monteCarlo.successRate, 0)} status={successStatus} />
        <StatTile label="Median ending" value={formatCurrency(monteCarlo.medianFinalBalance, { compact: true })} />
      </div>
      <dl className="mt-4 text-sm space-y-1.5">
        <Row label="Retirement age" value={String(scenario.household.primary.retirementAge)} />
        <Row
          label="Annual spending"
          value={formatCurrency(scenario.household.assumptions.annualRetirementSpending)}
        />
        <Row
          label="Withdrawal strategy"
          value={WITHDRAWAL_STRATEGY_LABELS[scenario.household.assumptions.withdrawalStrategy]}
        />
        <Row
          label="Runs out?"
          value={projection.depletionYear ? `Yes, in ${projection.depletionYear}` : "No"}
        />
      </dl>

      <div className="flex flex-wrap gap-2 mt-5 text-xs">
        {!isActive && (
          <button
            onClick={() => setActiveScenario(scenario.id)}
            className="rounded-full border px-3 py-1.5 font-medium"
            style={{ background: "var(--surface-2)" }}
          >
            Set active
          </button>
        )}
        <button
          onClick={() => duplicateScenario(scenario.id)}
          className="rounded-full border px-3 py-1.5 font-medium"
          style={{ background: "var(--surface-2)" }}
        >
          Duplicate
        </button>
        {scenarioCount > 1 && (
          <button
            onClick={() => {
              if (confirm(`Delete "${scenario.name}"? This can't be undone.`)) {
                deleteScenario(scenario.id);
              }
            }}
            className="rounded-full border px-3 py-1.5 font-medium ml-auto"
            style={{ color: "var(--status-critical)" }}
          >
            Delete
          </button>
        )}
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt style={{ color: "var(--text-secondary)" }}>{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
