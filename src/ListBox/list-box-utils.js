/**
 * Max height values for listbox/dropdown menus by size.
 * @type {Readonly<{ sm: string; md: string; lg: string; xl: string }>}
 */
export const MENU_MAX_HEIGHT = Object.freeze({
  sm: "11rem",
  md: "13.75rem",
  lg: "16.5rem",
  xl: "16.5rem",
});

/**
 * Get the max height for a listbox/dropdown menu based on size.
 * @param {"sm" | "md" | "lg" | "xl"} [size]
 * @returns {string}
 */
export function getMenuMaxHeight(size) {
  return MENU_MAX_HEIGHT[size] ?? MENU_MAX_HEIGHT.md;
}
