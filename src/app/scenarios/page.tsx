"use client";

import { usePlannerStore } from "@/lib/store";
import { ScenarioCard } from "@/components/ScenarioCard";

export default function ScenariosPage() {
  const scenarios = usePlannerStore((s) => s.scenarios);
  const activeScenarioId = usePlannerStore((s) => s.activeScenarioId);
  const createScenario = usePlannerStore((s) => s.createScenario);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compare scenarios</h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Try &ldquo;retire at 60&rdquo;, &ldquo;spend $10k more&rdquo;, or a different
            withdrawal strategy — each scenario is a full, independent copy of your plan.
          </p>
        </div>
        <button
          onClick={() => createScenario("New scenario", activeScenarioId)}
          className="text-sm font-medium rounded-full border px-4 py-2 shrink-0"
          style={{ background: "var(--surface-2)" }}
        >
          + Duplicate active plan
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} isActive={scenario.id === activeScenarioId} />
        ))}
      </div>
    </div>
  );
}
