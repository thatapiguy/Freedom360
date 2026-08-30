"use client";

import type { Household, OneTimeItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { NumberField, TextField } from "@/components/ui/fields";
import { generateId } from "@/lib/id";

export function OneTimeForm({
  household,
  setHousehold,
}: {
  household: Household;
  setHousehold: (updater: (h: Household) => Household) => void;
}) {
  const update = (id: string, patch: Partial<OneTimeItem>) =>
    setHousehold((h) => ({
      ...h,
      oneTimeItems: h.oneTimeItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const remove = (id: string) =>
    setHousehold((h) => ({
      ...h,
      oneTimeItems: h.oneTimeItems.filter((i) => i.id !== id),
    }));

  const add = () =>
    setHousehold((h) => ({
      ...h,
      oneTimeItems: [
        ...h.oneTimeItems,
        {
          id: generateId(),
          name: "One-time expense",
          age: h.primary.retirementAge,
          amount: 10_000,
        },
      ],
    }));

  return (
    <Card
      title="One-time expenses & windfalls"
      subtitle="A new roof, a wedding, an inheritance — anything that hits in a single year. Use a negative amount for a windfall."
    >
      <div className="space-y-3">
        {household.oneTimeItems.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-3 rounded-xl border p-3"
            style={{ background: "var(--surface-2)" }}
          >
            <TextField value={item.name} onCommit={(name) => update(item.id, { name })} />
            <NumberField
              label="Age"
              value={item.age}
              min={household.primary.currentAge}
              max={household.primary.lifeExpectancy}
              onCommit={(age) => update(item.id, { age })}
            />
            <NumberField
              label="Amount"
              value={item.amount}
              step={1000}
              onCommit={(amount) => update(item.id, { amount })}
            />
            <button
              onClick={() => remove(item.id)}
              className="text-xs mb-2.5"
              style={{ color: "var(--text-muted)" }}
            >
              Remove
            </button>
          </div>
        ))}
        {household.oneTimeItems.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            None yet.
          </p>
        )}
      </div>
      <button
        onClick={add}
        className="mt-4 rounded-lg border border-dashed px-4 py-2 text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        + Add one-time item
      </button>
    </Card>
  );
}
