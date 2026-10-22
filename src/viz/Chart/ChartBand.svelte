<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /** @restProps {g} */

  /**
   * Specify how to read the band's lower value from a datum: a key or a
   * function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let lower;

  /**
   * Specify how to read the band's upper value from a datum: a key or a
   * function.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let upper;

  /**
   * Specify the curve. Match the line the band belongs to.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "linear";

  /**
   * Specify the fill opacity. Nest bands with lower opacity outside for a
   * fan chart.
   */
  export let opacity = 0.2;

  /**
   * Restrict the mark to these series keys.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  import { getContext, onMount } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { bandExtent, buildBands } from "./band-geometry.js";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups } from "./model.js";

  /** @type {import("./context.js").ChartContext<T>} */
  const { groups, scales, includeY, clip } = getContext(CHART_CONTEXT);

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // The band may reach past the line. Registering rebuilds the series, which
  // runs this again: only write when the extent itself moved.
  /**
   * @param {ReadonlyArray<import("./model.js").ChartGroup<T>>} current
   * @param {(row: T, index: number) => unknown} lo
   * @param {(row: T, index: number) => unknown} hi
   */
  function include(current, lo, hi) {
    const next = bandExtent(current, lo, hi);
    if (
      next === registered ||
      (next &&
        registered &&
        next[0] === registered[0] &&
        next[1] === registered[1])
    ) {
      return;
    }
    for (const release of releases) release();
    releases = next ? [includeY(next[0]), includeY(next[1])] : [];
    registered = next;
  }

  $: lowerOf = toAccessor(lower);
  $: upperOf = toAccessor(upper);
  $: mine = pickGroups($groups, series);
  $: include(mine, lowerOf, upperOf);
  // Depends on groups and scales only, so hover never rebuilds a band.
  $: bands = buildBands(mine, $scales, {
    lower: lowerOf,
    upper: upperOf,
    curve,
  });

  onMount(() => () => {
    for (const release of releases) release();
  });
</script>

<g
  clip-path={$clip}
  class:bx--viz-band={true}
  aria-hidden="true"
  {...$$restProps}
>
  {#each bands as band (band.key)}
    <path
      class:bx--viz-band__fill={true}
      d={band.d}
      fill-opacity={opacity}
      style:--bx-viz-color={band.color}
    />
  {/each}
</g>
