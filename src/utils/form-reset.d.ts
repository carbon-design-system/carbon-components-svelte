/** Calls `onReset` after the form that owns `node` resets. SSR-safe. */
export function formReset(
  node:
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLFieldSetElement,
  onReset: () => void,
): { update: (onReset: () => void) => void; destroy: () => void };
