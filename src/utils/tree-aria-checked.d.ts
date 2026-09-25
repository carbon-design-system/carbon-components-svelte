/**
 * Tri-state value for a tree row's `aria-checked`.
 */
export function toAriaChecked(
  isSelected: boolean,
  isIndeterminate: boolean,
): "true" | "false" | "mixed";
