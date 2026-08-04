"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe localStorage-backed boolean, read via useSyncExternalStore
 * (React's supported way to read external state on mount without a
 * setState-in-effect round trip). Server snapshot is always `false`.
 */
export function useLocalStorageBoolean(key: string): [boolean, (next: boolean) => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    [],
  );
  const getSnapshot = useCallback(() => window.localStorage.getItem(key) === "true", [key]);
  const getServerSnapshot = useCallback(() => false, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: boolean) => {
      window.localStorage.setItem(key, String(next));
      // useSyncExternalStore has no built-in "notify" for same-tab writes
      // to the same storage key (the `storage` event only fires in other
      // tabs) — dispatch one so this hook's snapshot re-reads immediately.
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    [key],
  );

  return [value, setValue];
}
