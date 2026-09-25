/**
 * Keeps an input's `value` attribute on `value`, so a form reset leaves
 * the current value in place. `undefined` leaves the attribute alone.
 */
export function reflectDefaultValue(
  node: HTMLInputElement,
  value: null | number | string | undefined,
): { update: (value: null | number | string | undefined) => void };
