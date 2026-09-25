<script lang="ts">
  import CssGrid from "carbon-components-svelte/Grid/CssGrid.svelte";

  export let narrow = false;
  export let condensed = false;
  export let fullWidth = false;
  export let withRowGap = false;
  export let as = false;
</script>

{#if as}
  <CssGrid
    {as}
    {narrow}
    {condensed}
    {fullWidth}
    {withRowGap}
    {...$$restProps}
    let:props
  >
    <main {...props}><slot /></main>
  </CssGrid>
{:else}
  <CssGrid {narrow} {condensed} {fullWidth} {withRowGap} {...$$restProps}>
    <slot />
  </CssGrid>
{/if}
