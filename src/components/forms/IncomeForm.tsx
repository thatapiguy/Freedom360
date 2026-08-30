"use client";

import type { Household, IncomeSource, IncomeType } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { NumberField, PercentField, SelectField, TextField } from "@/components/ui/fields";
import { generateId } from "@/lib/id";

const TYPE_OPTIONS: { value: IncomeType; label: string }[] = [
  { value: "salary", label: "Salary" },
  { value: "socialSecurity", label: "Social Security" },
  { value: "pension", label: "Pension" },
  { value: "rental", label: "Rental income" },
  { value: "other", label: "Other" },
];

export function IncomeForm({
  household,
  setHousehold,
}: {
  household: Household;
  setHousehold: (updater: (h: Household) => Household) => void;
}) {
  const update = (id: string, patch: Partial<IncomeSource>) =>
    setHousehold((h) => ({
      ...h,
      incomeSources: h.incomeSources.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  const remove = (id: string) =>
    setHousehold((h) => ({
      ...h,
      incomeSources: h.incomeSources.filter((s) => s.id !== id),
    }));

  const add = () =>
    setHousehold((h) => ({
      ...h,
      incomeSources: [
        ...h.incomeSources,
        {
          id: generateId(),
          name: "New income",
          type: "other",
          owner: "primary",
          annualAmount: 0,
          startAge: h.primary.retirementAge,
          colaPct: 0,
        },
      ],
    }));

  return (
    <Card
      title="Guaranteed income"
      subtitle="Social Security, pensions, rental or part-time income — anything that reduces what your portfolio needs to cover."
    >
      <div className="space-y-4">
        {household.incomeSources.map((source) => (
          <div key={source.id} className="rounded-xl border p-4" style={{ background: "var(--surface-2)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <TextField value={source.name} onCommit={(name) => update(source.id, { name })} />
              </div>
              <button
                onClick={() => remove(source.id)}
                className="text-xs shrink-0 mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SelectField
                label="Type"
                value={source.type}
                options={TYPE_OPTIONS}
                onChange={(type) => update(source.id, { type })}
              />
              {household.spouse && (
                <SelectField
                  label="Owner"
                  value={source.owner}
                  options={[
                    { value: "primary", label: "You" },
                    { value: "spouse", label: "Spouse" },
                  ]}
                  onChange={(owner) => update(source.id, { owner })}
                />
              )}
              <NumberField
                label="Annual amount"
                value={source.annualAmount}
                min={0}
                step={500}
                onCommit={(annualAmount) => update(source.id, { annualAmount })}
              />
              <NumberField
                label="Starts at age"
                value={source.startAge}
                min={0}
                max={110}
                onCommit={(startAge) => update(source.id, { startAge })}
              />
              <NumberField
                label="Ends at age"
                value={source.endAge ?? household.primary.lifeExpectancy}
                min={source.startAge}
                max={110}
                hint="Defaults to end of plan"
                onCommit={(endAge) => update(source.id, { endAge })}
              />
              <PercentField
                label="Real growth"
                hint="0 = keeps pace with inflation"
                value={source.colaPct}
                min={-10}
                max={10}
                onCommit={(colaPct) => update(source.id, { colaPct })}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-4 rounded-lg border border-dashed px-4 py-2 text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        + Add income source
      </button>
    </Card>
  );
}
