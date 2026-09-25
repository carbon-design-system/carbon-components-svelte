<script lang="ts">
  import CssColumn from "carbon-components-svelte/Grid/CssColumn.svelte";
  import CssGrid from "carbon-components-svelte/Grid/CssGrid.svelte";

  export let narrow = false;
  export let condensed = false;
  export let fullWidth = false;
  export let withRowGap = false;
  export let as = false;
  export let mode: "wide" | "narrow" | "condensed" | undefined = undefined;
  export let layout: "single" | "nested" | "siblings" = "single";
</script>

{#if layout === "nested"}
  <CssGrid data-testid="outer-grid">
    <CssColumn>
      <CssGrid
        data-testid="inner-grid"
        {mode}
        {narrow}
        {condensed}
        {fullWidth}
        {withRowGap}
      >
        Nested
      </CssGrid>
    </CssColumn>
  </CssGrid>
{:else if layout === "siblings"}
  <CssGrid data-testid="first-grid">First</CssGrid>
  <CssGrid data-testid="second-grid">Second</CssGrid>
{:else if as}
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
