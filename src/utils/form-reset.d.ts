/**
 * Calls `onReset` after the form that owns `node` resets: its `form` for a
 * form control or fieldset, otherwise its closest ancestor form. SSR-safe.
 */
export function formReset(
  node: HTMLElement,
  onReset: () => void,
): { update: (onReset: () => void) => void; destroy: () => void };
