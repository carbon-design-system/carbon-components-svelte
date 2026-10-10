<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the y value to mark.
   * The chart keeps it inside the y domain.
   * @type {number}
   */
  export let y;

  /**
   * Specify a second y value to mark a range, such as an acceptable band.
   * The space between `y` and `to` is shaded, and both stay inside the
   * y domain. The rule is drawn at `y`.
   * @type {number}
   */
  export let to = undefined;

  /** Specify the label, drawn at the end of the rule */
  export let label = "";

  /**
   * Specify the kind, which sets the color.
   * @type {"error" | "warning" | "success" | "info"}
   */
  export let kind = "error";

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { scales, includeY, reserveMargin } = getContext(CHART_CONTEXT);

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {string} */
  let registered = "";

  // Registering changes the domain, which can run this again: only act when
  // a value itself moved.
  /**
   * @param {number} value
   * @param {number | undefined} end
   */
  function register(value, end) {
    const values = [value, end].filter(
      (n) => typeof n === "number" && Number.isFinite(n),
    );
    const key = values.join(",");
    if (key === registered) return;
    for (const release of releases) release();
    releases = values.map((n) => includeY(/** @type {number} */ (n)));
    registered = key;
  }

  /** @type {(() => void) | undefined} */
  let releaseMargin;

  // In a horizontal chart the label sits above the plot, clear of the bars.
  // Reserving rebuilds the scales, which runs this again: only act on a change.
  /** @param {boolean} needed */
  function reserve(needed) {
    if (needed === Boolean(releaseMargin)) return;
    releaseMargin?.();
    releaseMargin = needed ? reserveMargin("top", 12) : undefined;
  }

  $: register(y, to);
  $: reserve(Boolean(label) && $scales.horizontal);
  $: py = $scales.y.map(y);
  $: pTo =
    typeof to === "number" && Number.isFinite(to) ? $scales.y.map(to) : null;

  onMount(() => () => {
    for (const release of releases) release();
    releaseMargin?.();
  });
</script>

{#if Number.isFinite(y)}
  <g
    class:bx--viz-threshold={true}
    class:bx--viz-threshold--warning={kind === "warning"}
    class:bx--viz-threshold--success={kind === "success"}
    class:bx--viz-threshold--info={kind === "info"}
    aria-hidden="true"
    {...$$restProps}
  >
    {#if pTo !== null}
      <rect
        class:bx--viz-threshold__range={true}
        x={$scales.horizontal ? Math.min(py, pTo) : $scales.plot.x0}
        y={$scales.horizontal ? $scales.plot.y0 : Math.min(py, pTo)}
        width={$scales.horizontal
          ? Math.abs(pTo - py)
          : $scales.plot.x1 - $scales.plot.x0}
        height={$scales.horizontal
          ? $scales.plot.y1 - $scales.plot.y0
          : Math.abs(pTo - py)}
      />
    {/if}
    <line
      class:bx--viz-threshold__line={true}
      x1={$scales.horizontal ? py : $scales.plot.x0}
      x2={$scales.horizontal ? py : $scales.plot.x1}
      y1={$scales.horizontal ? $scales.plot.y0 : py}
      y2={$scales.horizontal ? $scales.plot.y1 : py}
    />
    {#if label}
      <text
        class:bx--viz-threshold__label={true}
        x={$scales.horizontal ? py : $scales.plot.x1}
        y={$scales.horizontal ? $scales.plot.y0 - 6 : py - 6}
        text-anchor={$scales.horizontal ? "middle" : "end"}
      >
        {label}
      </text>
    {/if}
  </g>
{/if}
