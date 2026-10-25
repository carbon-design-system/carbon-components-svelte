// @ts-check
// Context shared by `Chart` and the marks composed inside it.

/** @typedef {import("./context.d.ts").ChartContext<any>} ChartContext */

export const CHART_CONTEXT = "carbon:viz:Chart";

/** Context a facet grid gives the charts inside it. */
export const FACETS_CONTEXT = "carbon:viz:SmallMultiples";

/** Context `ChartColors` gives every chart inside it: a store of series colors. */
export const CHART_COLORS_CONTEXT = "carbon:viz:ChartColors";
