"use client";

import type { AccountType, FilingStatus, Household, WithdrawalStrategy } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { NumberField, PercentField, SelectField } from "@/components/ui/fields";
import {
  WITHDRAWAL_STRATEGY_DESCRIPTIONS,
  WITHDRAWAL_STRATEGY_LABELS,
} from "@/lib/calc/withdrawal";

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married filing jointly" },
];

const STRATEGY_OPTIONS: { value: WithdrawalStrategy; label: string }[] = (
  Object.keys(WITHDRAWAL_STRATEGY_LABELS) as WithdrawalStrategy[]
).map((value) => ({ value, label: WITHDRAWAL_STRATEGY_LABELS[value] }));

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  taxable: "Taxable",
  traditional: "Traditional",
  roth: "Roth",
  hsa: "HSA",
};

export function AssumptionsForm({
  household,
  setHousehold,
}: {
  household: Household;
  setHousehold: (updater: (h: Household) => Household) => void;
}) {
  const { assumptions } = household;
  const patch = (p: Partial<Household["assumptions"]>) =>
    setHousehold((h) => ({ ...h, assumptions: { ...h.assumptions, ...p } }));

  const order = assumptions.withdrawalOrder;
  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    patch({ withdrawalOrder: next });
  };

  const usedTypes = new Set(order);
  const unusedTypes = (Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).filter(
    (t) => !usedTypes.has(t)
  );

  return (
    <div className="space-y-6">
      <Card title="Spending & taxes" subtitle="All dollar figures are in today's purchasing power.">
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Filing status"
            value={assumptions.filingStatus}
            options={FILING_OPTIONS}
            onChange={(filingStatus) => patch({ filingStatus })}
          />
          <PercentField
            label="Inflation assumption"
            value={assumptions.inflationRate}
            min={0}
            max={10}
            onCommit={(inflationRate) => patch({ inflationRate })}
          />
          <NumberField
            label="Annual retirement spending"
            hint="In today's dollars, before Social Security/pension"
            value={assumptions.annualRetirementSpending}
            min={0}
            step={1000}
            onCommit={(annualRetirementSpending) => patch({ annualRetirementSpending })}
          />
          <NumberField
            label="Healthcare bridge (until 65)"
            hint="Extra annual cost before Medicare eligibility"
            value={assumptions.healthcareBridgeAnnual}
            min={0}
            step={500}
            onCommit={(healthcareBridgeAnnual) => patch({ healthcareBridgeAnnual })}
          />
          <PercentField
            label="Taxable gains fraction"
            hint="Share of a taxable withdrawal treated as a capital gain"
            value={assumptions.taxableGainFraction}
            min={0}
            max={100}
            onCommit={(taxableGainFraction) => patch({ taxableGainFraction })}
          />
          <NumberField
            label="Monte Carlo runs"
            hint="More runs = smoother results, slower to compute"
            value={assumptions.monteCarloRuns}
            min={100}
            max={3000}
            step={100}
            onCommit={(monteCarloRuns) => patch({ monteCarloRuns })}
          />
        </div>
      </Card>

      <Card
        title="Withdrawal strategy"
        subtitle="How much you pull from your portfolio each year in retirement."
      >
        <SelectField
          value={assumptions.withdrawalStrategy}
          options={STRATEGY_OPTIONS}
          onChange={(withdrawalStrategy) => patch({ withdrawalStrategy })}
        />
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          {WITHDRAWAL_STRATEGY_DESCRIPTIONS[assumptions.withdrawalStrategy]}
        </p>

        <div className="mt-5">
          <div className="text-sm font-medium mb-2">Withdrawal order</div>
          <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
            Which account type to draw down first, second, and so on. Required minimum
            distributions (age 73+) are always taken from traditional accounts regardless
            of this order.
          </p>
          <ol className="space-y-2">
            {order.map((type, i) => (
              <li
                key={type}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                style={{ background: "var(--surface-2)" }}
              >
                <span>
                  <span style={{ color: "var(--text-muted)" }}>{i + 1}.</span>{" "}
                  {ACCOUNT_TYPE_LABEL[type]}
                </span>
                <span className="flex gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="w-6 h-6 rounded disabled:opacity-30"
                    style={{ color: "var(--text-secondary)" }}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    className="w-6 h-6 rounded disabled:opacity-30"
                    style={{ color: "var(--text-secondary)" }}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
          {unusedTypes.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {unusedTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => patch({ withdrawalOrder: [...order, t] })}
                  className="text-xs rounded-full border px-3 py-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  + {ACCOUNT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
