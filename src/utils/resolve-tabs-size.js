// @ts-check

/**
 * Tabs size scale, in ascending order.
 * @type {ReadonlyArray<"sm" | "md" | "lg" | "xl">}
 */
export const TABS_SIZE_SCALE = ["sm", "md", "lg", "xl"];

/**
 * Clamp `size` to the largest size the current tab type supports. Line
 * tabs (`type="default"`) support up to `"lg"` (`maxSizeIndex` 2);
 * container tabs support the full range up to `"xl"` (`maxSizeIndex`
 * 3), mirroring Carbon's own `layout.use($min, $max)` clamping. An
 * unrecognized value is ignored (no class), same as leaving `size`
 * unset.
 *
 * @param {"sm" | "md" | "lg" | "xl" | undefined} size
 * @param {number} maxSizeIndex
 * @returns {"sm" | "md" | "lg" | "xl" | undefined}
 */
export function resolveTabsSize(size, maxSizeIndex) {
  if (!size) return undefined;
  const index = TABS_SIZE_SCALE.indexOf(size);
  if (index === -1) return undefined;
  return TABS_SIZE_SCALE[Math.min(index, maxSizeIndex)];
}
