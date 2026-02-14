/** Max height values for listbox/dropdown menus by size */
export declare const MENU_MAX_HEIGHT: Readonly<{
  sm: string;
  md: string;
  lg: string;
  xl: string;
}>;

/**
 * Get the max height for a listbox/dropdown menu based on size.
 * @param size - The size variant
 * @returns The max height in rem units
 */
export declare function getMenuMaxHeight(
  size?: "sm" | "md" | "lg" | "xl",
): string;
