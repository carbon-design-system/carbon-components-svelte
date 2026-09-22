<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /** @restProps {g} */

  /**
   * Specify which data are anomalies: a key of a boolean field, or a
   * function of the datum, its index in its series, and the series key.
   * `flagAnomalies` computes flags from a series by z-score.
   * @type {import("../utils/accessor.js").Accessor<T, boolean | null | undefined> | ((row: T, index: number, series: string | number) => boolean | null | undefined)}
   */
  export let when;

  /** Specify the name announced with each marker */
  export let label = "Anomaly";

  /** Specify the marker's half-width in pixels */
  export let size = 5;

  /**
   * Restrict the mark to these series keys.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups, yScaleOf } from "./model.js";

  /** @type {import("./context.js").ChartContext<T>} */
  const { groups, scales, clip } = getContext(CHART_CONTEXT);

  /**
   * @param {ReadonlyArray<import("./model.js").ChartGroup<T>>} current
   * @param {typeof when} test
   * @param {import("./model.js").ChartScales} at
   */
  function place(current, test, at) {
    const flagged = [];
    for (const group of current) {
      if (group.hidden) continue;
      const scale = yScaleOf(at, group);
      for (let i = 0; i < group.rows.length; i++) {
        const row = group.rows[i];
        const hit =
          typeof test === "function"
            ? test(row, i, group.key)
            : /** @type {any} */ (row)?.[test];
        if (!hit || !Number.isFinite(group.ys[i])) continue;
        const along = at.x.map(group.xs[i]);
        const across = scale.map(group.ys[i]);
        flagged.push({
          key: JSON.stringify([group.key, i]),
          series: group.key,
          index: i,
          datum: row,
          x: at.horizontal ? across : along,
          y: at.horizontal ? along : across,
          color: group.color,
          name: `${label}: ${at.xLabel(group.xs[i])}, ${at.yFormat(group.ys[i])}`,
        });
      }
    }
    return flagged;
  }

  // Depends on groups and scales only, so hover never places them again.
  $: markers = place(pickGroups($groups, series), when, $scales);
</script>

<g clip-path={$clip} class:bx--viz-anomaly={true} {...$$restProps}>
  {#each markers as marker (marker.key)}
    <!-- A diamond, so an anomaly reads by shape and not by color alone. -->
    <!-- A click lands on the chart, which selects the hovered datum. -->
    <!-- A nested svg, since a named group is not a thing to the linter. -->
    <svg role="img" aria-label={marker.name} overflow="visible">
      <title>{marker.name}</title>
      <path
        class:bx--viz-anomaly__marker={true}
        d="M{marker.x},{marker.y - size}L{marker.x + size},{marker.y}L{marker.x},{marker.y + size}L{marker.x - size},{marker.y}Z"
        style:--bx-viz-color={marker.color}
      />
    </svg>
  {/each}
</g>
