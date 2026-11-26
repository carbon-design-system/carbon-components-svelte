import type { Readable } from "svelte/store";

export function lazyComponent<T>(
  loader: () => Promise<{ default: T }>,
): Readable<T | null> & { load(): void };
