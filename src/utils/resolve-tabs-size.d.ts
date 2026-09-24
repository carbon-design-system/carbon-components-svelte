/** Tabs size scale, in ascending order. */
export const TABS_SIZE_SCALE: ReadonlyArray<"sm" | "md" | "lg" | "xl">;

/**
 * Clamp `size` to the largest size the current tab type supports. Line
 * tabs (`type="default"`) support up to `"lg"` (`maxSizeIndex` 2);
 * container tabs support the full range up to `"xl"` (`maxSizeIndex` 3),
 * mirroring Carbon's own `layout.use($min, $max)` clamping. An
 * unrecognized value is ignored (no class), same as leaving `size` unset.
 */
export function resolveTabsSize(
  size: "sm" | "md" | "lg" | "xl" | undefined,
  maxSizeIndex: number,
): "sm" | "md" | "lg" | "xl" | undefined;
