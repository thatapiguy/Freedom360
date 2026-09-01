"use client";

import { useState } from "react";
import type { Household, LifeEvent, LifeEventCategory } from "@/lib/types";
import {
  INCOME_EVENT_CATEGORIES,
  LIFE_EVENT_CATEGORIES,
  SPENDING_GOAL_CATEGORIES,
  defaultNameForCategory,
} from "@/lib/lifeEventCategories";
import { generateId } from "@/lib/id";
import { Field, NumberField, PercentField, SelectField, TextField } from "@/components/ui/fields";

type TimingMode = "oneTime" | "recurring";

export function LifeEventModal({
  kind,
  household,
  onClose,
  onSave,
}: {
  kind: "expense" | "income";
  household: Household;
  onClose: () => void;
  onSave: (event: LifeEvent) => void;
}) {
  const [category, setCategory] = useState<LifeEventCategory | null>(null);

  const categories = kind === "expense" ? SPENDING_GOAL_CATEGORIES : INCOME_EVENT_CATEGORIES;
  const accentColor = kind === "expense" ? "var(--series-2)" : "var(--series-3)";
  const title = kind === "expense" ? "Add spending goal" : "Add income event";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border shadow-lg"
        style={{ background: "var(--surface-1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center gap-3 px-5 py-4 border-b" style={{ background: "var(--surface-1)" }}>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
            style={{ background: "var(--surface-2)" }}
          >
            ✕
          </button>
          <h2 className="font-semibold text-lg">
            {category ? defaultNameForCategory(category) : title}
          </h2>
        </div>

        {!category ? (
          <ul>
            {(Object.keys(categories) as LifeEventCategory[]).map((key) => {
              const meta = LIFE_EVENT_CATEGORIES[key];
              return (
                <li key={key} className="border-b last:border-b-0">
                  <button
                    onClick={() => setCategory(key)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:opacity-80"
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ background: accentColor }}
                    >
                      {meta.icon}
                    </span>
                    <span className="font-medium">{meta.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <LifeEventDetailForm
            kind={kind}
            category={category}
            household={household}
            onBack={() => setCategory(null)}
            onSave={(event) => {
              onSave(event);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

function LifeEventDetailForm({
  kind,
  category,
  household,
  onBack,
  onSave,
}: {
  kind: "expense" | "income";
  category: LifeEventCategory;
  household: Household;
  onBack: () => void;
  onSave: (event: LifeEvent) => void;
}) {
  const meta = LIFE_EVENT_CATEGORIES[category];
  const [name, setName] = useState(meta.label);
  const [mode, setMode] = useState<TimingMode>(meta.defaultMode);
  const [amount, setAmount] = useState(kind === "expense" ? 10_000 : 20_000);
  const [oneTimeAge, setOneTimeAge] = useState(
    Math.min(household.primary.retirementAge, household.primary.currentAge + 10)
  );
  const [startAge, setStartAge] = useState(household.primary.retirementAge);
  const [endAge, setEndAge] = useState(household.primary.lifeExpectancy);
  const [growthPct, setGrowthPct] = useState(0);
  const [owner, setOwner] = useState<"primary" | "spouse">("primary");

  const handleSave = () => {
    const timing =
      mode === "oneTime"
        ? ({ mode: "oneTime", age: oneTimeAge } as const)
        : ({ mode: "recurring", startAge, endAge: Math.max(startAge, endAge), growthPct } as const);
    onSave({
      id: generateId(),
      name: name.trim() || meta.label,
      kind,
      category,
      owner,
      amount,
      timing,
    });
  };

  return (
    <div className="px-5 py-5 space-y-4">
      <button onClick={onBack} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        ← Choose a different category
      </button>

      <TextField label="Name" value={name} onCommit={setName} />

      {household.spouse && (
        <SelectField
          label="Whose event is this?"
          value={owner}
          options={[
            { value: "primary", label: household.primary.name || "You" },
            { value: "spouse", label: household.spouse.name || "Spouse" },
          ]}
          onChange={setOwner}
        />
      )}

      <Field label="Timing">
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {(["oneTime", "recurring"] as TimingMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 font-medium"
              style={{
                background: mode === m ? "var(--series-1)" : "var(--surface-2)",
                color: mode === m ? "white" : "var(--text-secondary)",
              }}
            >
              {m === "oneTime" ? "One-time" : "Recurring"}
            </button>
          ))}
        </div>
      </Field>

      <NumberField
        label={mode === "oneTime" ? "Amount" : "Annual amount"}
        value={amount}
        min={0}
        step={mode === "oneTime" ? 1000 : 500}
        onCommit={setAmount}
        hint="In today's dollars"
      />

      {mode === "oneTime" ? (
        <NumberField
          label={`${owner === "spouse" ? "Spouse's" : "Your"} age when this happens`}
          value={oneTimeAge}
          min={household.primary.currentAge}
          max={household.primary.lifeExpectancy}
          onCommit={setOneTimeAge}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Start age"
            value={startAge}
            min={household.primary.currentAge}
            max={household.primary.lifeExpectancy}
            onCommit={setStartAge}
          />
          <NumberField
            label="End age"
            value={endAge}
            min={startAge}
            max={household.primary.lifeExpectancy}
            onCommit={setEndAge}
          />
          <div className="col-span-2">
            <PercentField
              label="Real growth"
              hint="0 = keeps pace with inflation"
              value={growthPct}
              min={-10}
              max={10}
              onCommit={setGrowthPct}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full rounded-lg py-2.5 font-medium text-white"
        style={{ background: "var(--series-1)" }}
      >
        Add {kind === "expense" ? "spending goal" : "income event"}
      </button>
    </div>
  );
}
