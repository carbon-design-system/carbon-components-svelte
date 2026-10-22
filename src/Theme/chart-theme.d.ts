import type { Readable } from "svelte/store";

/** The themes Carbon Charts supports for its `theme` option. */
export type ChartTheme = "white" | "g10" | "g90" | "g100";

/**
 * Map a Carbon theme to the `theme` option of Carbon Charts. Charts has no
 * Gray 80, so `g80` maps to `g90`. Any other value maps to `white`, the
 * Charts default.
 * @example
 * toChartTheme("g80"); // "g90"
 */
export function toChartTheme(theme: string | null | undefined): ChartTheme;

/**
 * A store of the Carbon Charts theme for the nearest `ThemeZone`, or for the
 * page theme outside a zone. The page theme is the `theme` attribute that
 * `Theme` and `themeScript` set on `<html>`, so the store follows persisted
 * and system themes too. Call during component initialization.
 * @example
 * ```svelte
 * <script>
 *   import { getChartTheme } from "carbon-components-svelte";
 *   import { BarChartSimple } from "@carbon/charts-svelte";
 *
 *   const chartTheme = getChartTheme();
 * </script>
 *
 * <BarChartSimple {data} options={{ ...options, theme: $chartTheme }} />
 * ```
 */
export function getChartTheme(): Readable<ChartTheme>;
