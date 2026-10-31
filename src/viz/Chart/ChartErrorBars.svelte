<svelte:options immutable />

<script>
  /**
   * @restProps {g}
   */

  /**
   * Specify how to read the low end of a datum's interval: a key or a
   * function of the row. With `error` instead, the interval is symmetric.
   * @type {import("../utils/accessor.js").Accessor<any, number> | undefined}
   */
  export let lo = undefined;

  /**
   * Specify how to read the high end of a datum's interval.
   * @type {import("../utils/accessor.js").Accessor<any, number> | undefined}
   */
  export let hi = undefined;

  /**
   * Specify how to read a symmetric error, drawn as `y ± error`.
   * @type {import("../utils/accessor.js").Accessor<any, number> | undefined}
   */
  export let error = undefined;

  /** Specify the width of the caps, in pixels */
  export let cap = 6;

  /**
   * Specify the series to draw. Defaults to every series.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  /**
   * Set to the bars' options to center each interval on its bar in a
   * grouped bar chart, instead of on the x position.
   * @type {{ mode?: "grouped" | "stacked"; padding?: number; maxBarWidth?: number } | undefined}
   */
  export let bars = undefined;

  import { getContext } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { buildBars } from "./bar-geometry.js";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups, yScaleOf } from "./model.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, clip } = getContext(CHART_CONTEXT);

  $: loOf = lo === undefined ? undefined : toAccessor(lo);
  $: hiOf = hi === undefined ? undefined : toAccessor(hi);
  $: errorOf = error === undefined ? undefined : toAccessor(error);
  $: mine = pickGroups($groups, series);
  // Bar centers, when the intervals belong to bars.
  $: lanes = bars
    ? new Map(
        buildBars(mine, $scales, bars).map((bar) => [
          `${bar.series}:${bar.index}`,
          $scales.horizontal ? bar.y + bar.height / 2 : bar.x + bar.width / 2,
        ]),
      )
    : null;
  // Depends on groups and scales only, so hover never rebuilds an interval.
  $: intervals = mine.flatMap((group) => {
    const y = yScaleOf($scales, group);
    /** @type {Array<{ key: string; along: number; from: number; to: number; color: string }>} */
    const out = [];
    for (let i = 0; i < group.xs.length; i++) {
      const row = group.rows[i];
      const value = group.ys[i];
      let low = Number.NaN;
      let high = Number.NaN;
      if (errorOf) {
        const e = Number(errorOf(row, i));
        low = value - e;
        high = value + e;
      } else if (loOf && hiOf) {
        low = Number(loOf(row, i));
        high = Number(hiOf(row, i));
      }
      if (!Number.isFinite(low) || !Number.isFinite(high)) continue;
      const key = `${group.key}:${i}`;
      const along = lanes?.get(key) ?? $scales.x.map(group.xs[i]);
      out.push({
        key,
        along,
        from: y.map(low),
        to: y.map(high),
        color: group.color,
      });
    }
    return out;
  });
  $: half = cap / 2;
</script>

<g clip-path={$clip} class:bx--viz-errors={true} {...$$restProps}>
  {#each intervals as interval (interval.key)}
    <path
      class:bx--viz-errors__bar={true}
      style:--bx-viz-color={interval.color}
      d={$scales.horizontal
        ? `M${interval.from},${interval.along}H${interval.to}M${interval.from},${interval.along - half}V${interval.along + half}M${interval.to},${interval.along - half}V${interval.along + half}`
        : `M${interval.along},${interval.from}V${interval.to}M${interval.along - half},${interval.from}H${interval.along + half}M${interval.along - half},${interval.to}H${interval.along + half}`}
    />
  {/each}
</g>
