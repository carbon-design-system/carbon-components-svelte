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
 * @param {"sm" | "md" | "lg" | "xl"} [size] - The size variant
 * @returns {string} The max height in rem units
 */
export function getMenuMaxHeight(size = "md") {
  return MENU_MAX_HEIGHT[size];
}

/**
 * Menu item heights (px) by size. Matches `.bx--list-box__menu-item` in
 * carbon-components (sm 2rem, md 2.5rem, lg/xl 3rem).
 * @type {Readonly<{ sm: number; md: number; lg: number; xl: number }>}
 */
export const MENU_ITEM_HEIGHT = Object.freeze({
  sm: 32,
  md: 40,
  lg: 48,
  xl: 48,
});

/**
 * Get the menu item height in pixels for a listbox/dropdown size.
 * @param {"sm" | "md" | "lg" | "xl"} [size] - The size variant
 * @returns {number} The item height in pixels
 */
export function getMenuItemHeight(size = "md") {
  return MENU_ITEM_HEIGHT[size] ?? MENU_ITEM_HEIGHT.md;
}
