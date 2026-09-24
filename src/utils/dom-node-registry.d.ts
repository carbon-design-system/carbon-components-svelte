import type { Writable } from "svelte/store";

export interface DomNodeRegistry {
  items: Writable<ReadonlyArray<HTMLElement>>;
  register: (node: HTMLElement) => void;
  unregister: (node: HTMLElement) => void;
}

/**
 * A writable-array registry of DOM nodes: push on register, filter out on
 * unregister. Registrations made within the same microtask are batched
 * into a single store flush.
 */
export function createDomNodeRegistry(): DomNodeRegistry;
