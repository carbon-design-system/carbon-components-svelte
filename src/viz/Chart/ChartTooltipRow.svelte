<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Specify the swatch color, as a CSS color value */
  export let color = "";

  /** Specify the label, usually the series name */
  export let label = "";

  /** Specify the formatted value */
  export let value = "";
</script>

<div class:bx--viz-chart-tooltip__row={true} {...$$restProps}>
  {#if color}
    <span
      class:bx--viz-chart-tooltip__swatch={true}
      style:--bx-viz-color={color}
    ></span>
  {/if}
  <span class:bx--viz-chart-tooltip__label={true}><slot>{label}</slot></span>
  <span class:bx--viz-chart-tooltip__value={true}>{value}</span>
</div>
