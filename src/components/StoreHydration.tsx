"use client";

import { useEffect } from "react";
import { usePlannerStore } from "@/lib/store";

/**
 * zustand's persist middleware reads localStorage, which doesn't exist on
 * the server. We skip automatic hydration and trigger it manually here,
 * after mount, so the very first client render matches the server's
 * (default-data) render exactly — then this swaps in the real saved data.
 */
export function StoreHydration() {
  useEffect(() => {
    Promise.resolve(usePlannerStore.persist.rehydrate()).finally(() => {
      usePlannerStore.getState().setHasHydrated(true);
    });
  }, []);
  return null;
}
