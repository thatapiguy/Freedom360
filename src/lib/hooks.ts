"use client";

import { useCallback, useMemo } from "react";
import { usePlannerStore, useActiveScenario } from "@/lib/store";
import type { Household } from "@/lib/types";
import { projectHousehold } from "@/lib/calc/projection";
import { runMonteCarlo } from "@/lib/calc/montecarlo";

export function useActiveHousehold(): [Household, (updater: (h: Household) => Household) => void] {
  const scenario = useActiveScenario();
  const updateHousehold = usePlannerStore((s) => s.updateHousehold);
  const setHousehold = useCallback(
    (updater: (h: Household) => Household) => {
      updateHousehold(scenario.id, updater);
    },
    [scenario.id, updateHousehold]
  );
  return [scenario.household, setHousehold];
}

export function useProjection(household: Household) {
  const key = useMemo(() => JSON.stringify(household), [household]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => projectHousehold(household), [key]);
}

export function useMonteCarlo(household: Household, runs?: number) {
  const key = useMemo(
    () => JSON.stringify(household) + `|${runs ?? ""}`,
    [household, runs]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => runMonteCarlo(household, runs), [key]);
}
