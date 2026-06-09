/** Max height values for listbox/dropdown menus by size */
export declare const MENU_MAX_HEIGHT: Readonly<{
  sm: string;
  md: string;
  lg: string;
  xl: string;
}>;

/**
 * Get the max height for a listbox/dropdown menu based on size.
 * @param size - The size variant (defaults to "md" when undefined)
 * @returns The max height in rem units
 */
export declare function getMenuMaxHeight(
  size?: "sm" | "md" | "lg" | "xl",
): string;

/** Menu item heights (px) by size */
export declare const MENU_ITEM_HEIGHT: Readonly<{
  sm: number;
  md: number;
  lg: number;
  xl: number;
}>;

/**
 * Get the menu item height in pixels for a listbox/dropdown size.
 * @param size - The size variant (defaults to "md" when undefined)
 * @returns The item height in pixels
 */
export declare function getMenuItemHeight(
  size?: "sm" | "md" | "lg" | "xl",
): number;
