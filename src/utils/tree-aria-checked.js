// @ts-check

/**
 * Tri-state value for a tree row's `aria-checked`.
 *
 * @param {boolean} isSelected
 * @param {boolean} isIndeterminate
 * @returns {"true" | "false" | "mixed"}
 */
export function toAriaChecked(isSelected, isIndeterminate) {
  if (isIndeterminate) return "mixed";
  return isSelected ? "true" : "false";
}
