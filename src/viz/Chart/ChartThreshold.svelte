<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the y value to mark.
   * The chart keeps it inside the y domain.
   * @type {number}
   */
  export let y;

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
  const { scales, includeY } = getContext(CHART_CONTEXT);

  /** @type {(() => void) | undefined} */
  let release;

  /** @param {number} value */
  function register(value) {
    release?.();
    release = Number.isFinite(value) ? includeY(value) : undefined;
  }

  $: register(y);
  $: py = $scales.y.map(y);

  onMount(() => () => release?.());
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
    <line
      class:bx--viz-threshold__line={true}
      x1={$scales.plot.x0}
      x2={$scales.plot.x1}
      y1={py}
      y2={py}
    />
    {#if label}
      <text
        class:bx--viz-threshold__label={true}
        x={$scales.plot.x1}
        y={py - 6}
        text-anchor="end"
      >
        {label}
      </text>
    {/if}
  </g>
{/if}
