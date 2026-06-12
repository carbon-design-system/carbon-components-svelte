import type { Readable } from "svelte/store";

/** Routify + Svelte 5: `$goto` in event handlers runs outside fragment context. */
export function subscribeRoutifyGoto<T>(goto: Readable<T>): {
  getNavigate: () => T | undefined;
  unsubscribe: () => void;
} {
  let navigate: T | undefined;

  const unsubscribe = goto.subscribe((fn) => {
    navigate = fn;
  });

  return {
    getNavigate: () => navigate,
    unsubscribe,
  };
}
