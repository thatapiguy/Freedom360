"use client";

import { useState } from "react";
import { usePlannerStore } from "@/lib/store";

export function ScenarioSwitcher() {
  const scenarios = usePlannerStore((s) => s.scenarios);
  const activeScenarioId = usePlannerStore((s) => s.activeScenarioId);
  const setActiveScenario = usePlannerStore((s) => s.setActiveScenario);
  const createScenario = usePlannerStore((s) => s.createScenario);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex items-center gap-2 shrink-0">
      <select
        value={activeScenarioId}
        onChange={(e) => setActiveScenario(e.target.value)}
        className="text-sm rounded-full border px-3 py-1.5 max-w-[9rem] sm:max-w-[14rem] truncate"
        style={{ background: "var(--surface-2)" }}
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button
        title="New scenario"
        onClick={() => {
          if (creating) return;
          setCreating(true);
          createScenario("New scenario", activeScenarioId);
          setCreating(false);
        }}
        className="text-sm w-8 h-8 rounded-full border flex items-center justify-center font-medium"
        style={{ background: "var(--surface-2)" }}
      >
        +
      </button>
    </div>
  );
}
