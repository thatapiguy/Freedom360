"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Household, Scenario } from "@/lib/types";
import { createDefaultHousehold } from "@/lib/defaults";
import { generateId } from "@/lib/id";

function createScenarioObject(name: string, household: Household): Scenario {
  const now = Date.now();
  return { id: generateId(), name, createdAt: now, updatedAt: now, household };
}

interface PlannerState {
  scenarios: Scenario[];
  activeScenarioId: string;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  createScenario: (name: string, fromHouseholdId?: string) => string;
  duplicateScenario: (scenarioId: string) => string;
  deleteScenario: (scenarioId: string) => void;
  renameScenario: (scenarioId: string, name: string) => void;
  updateHousehold: (
    scenarioId: string,
    updater: (household: Household) => Household
  ) => void;
  setActiveScenario: (scenarioId: string) => void;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; error?: string };
  resetAll: () => void;
}

const initialScenario = createScenarioObject(
  "My retirement plan",
  createDefaultHousehold()
);

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      scenarios: [initialScenario],
      activeScenarioId: initialScenario.id,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      createScenario: (name, fromHouseholdId) => {
        const source = fromHouseholdId
          ? get().scenarios.find((s) => s.id === fromHouseholdId)?.household
          : undefined;
        const scenario = createScenarioObject(
          name,
          source ? structuredClone(source) : createDefaultHousehold()
        );
        set((state) => ({
          scenarios: [...state.scenarios, scenario],
          activeScenarioId: scenario.id,
        }));
        return scenario.id;
      },

      duplicateScenario: (scenarioId) => {
        const original = get().scenarios.find((s) => s.id === scenarioId);
        if (!original) return scenarioId;
        const copy = createScenarioObject(
          `${original.name} (copy)`,
          structuredClone(original.household)
        );
        set((state) => ({
          scenarios: [...state.scenarios, copy],
          activeScenarioId: copy.id,
        }));
        return copy.id;
      },

      deleteScenario: (scenarioId) => {
        set((state) => {
          const remaining = state.scenarios.filter((s) => s.id !== scenarioId);
          const scenarios = remaining.length
            ? remaining
            : [createScenarioObject("My retirement plan", createDefaultHousehold())];
          const activeScenarioId =
            state.activeScenarioId === scenarioId
              ? scenarios[0].id
              : state.activeScenarioId;
          return { scenarios, activeScenarioId };
        });
      },

      renameScenario: (scenarioId, name) => {
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === scenarioId ? { ...s, name, updatedAt: Date.now() } : s
          ),
        }));
      },

      updateHousehold: (scenarioId, updater) => {
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === scenarioId
              ? {
                  ...s,
                  household: updater(s.household),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      setActiveScenario: (scenarioId) => set({ activeScenarioId: scenarioId }),

      exportData: () =>
        JSON.stringify(
          { scenarios: get().scenarios, exportedAt: new Date().toISOString() },
          null,
          2
        ),

      importData: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (!Array.isArray(parsed.scenarios)) {
            return { ok: false, error: "File doesn't contain any scenarios." };
          }
          set({
            scenarios: parsed.scenarios,
            activeScenarioId: parsed.scenarios[0]?.id ?? initialScenario.id,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Couldn't parse that file as JSON." };
        }
      },

      resetAll: () => {
        const scenario = createScenarioObject(
          "My retirement plan",
          createDefaultHousehold()
        );
        set({ scenarios: [scenario], activeScenarioId: scenario.id });
      },
    }),
    {
      name: "freedom360-planner",
      skipHydration: true,
      partialize: (state) => ({
        scenarios: state.scenarios,
        activeScenarioId: state.activeScenarioId,
      }),
    }
  )
);

export function useActiveScenario(): Scenario {
  const scenarios = usePlannerStore((s) => s.scenarios);
  const activeScenarioId = usePlannerStore((s) => s.activeScenarioId);
  return (
    scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0]
  );
}
