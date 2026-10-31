<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Specify the swatch color, as a CSS color value */
  export let color = "";

  /** Specify the label, usually the series name */
  export let label = "";

  /** Specify the formatted value */
  export let value = "";

  /**
   * Set to `true` on a row without a color, in a tooltip whose other rows
   * have one, so its label lines up with theirs.
   */
  export let indent = false;
</script>

<div class:bx--viz-chart-tooltip__row={true} {...$$restProps}>
  {#if color}
    <span
      class:bx--viz-chart-tooltip__swatch={true}
      style:--bx-viz-color={color}
    ></span>
  {:else if indent}
    <span
      class:bx--viz-chart-tooltip__swatch={true}
      class:bx--viz-chart-tooltip__swatch--blank={true}
    ></span>
  {/if}
  <span class:bx--viz-chart-tooltip__label={true}><slot>{label}</slot></span>
  <span class:bx--viz-chart-tooltip__value={true}>{value}</span>
</div>
