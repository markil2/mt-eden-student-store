"use client";

import { useSyncExternalStore } from "react";

interface PersistedStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
}

/** True once a persisted (localStorage) store has loaded, so pages don't flash "empty" states. */
export function useHydrated(store: PersistedStore): boolean {
  return useSyncExternalStore(
    (onChange) => store.persist.onFinishHydration(onChange),
    () => store.persist.hasHydrated(),
    () => false,
  );
}
