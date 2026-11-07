/** Svelte action that keeps focus in a table body when its row is removed. */
export function keepRowFocus(
  tbody: HTMLElement,
  options?: { enabled?: boolean },
): {
  update(options?: { enabled?: boolean }): void;
  destroy(): void;
};
