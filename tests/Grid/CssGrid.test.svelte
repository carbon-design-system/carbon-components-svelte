<script lang="ts">
  import CssColumn from "carbon-components-svelte/Grid/CssColumn.svelte";
  import CssGrid from "carbon-components-svelte/Grid/CssGrid.svelte";
  import type { ComponentProps } from "svelte";

  export let narrow = false;
  export let condensed = false;
  export let fullWidth = false;
  export let withRowGap = false;
  export let align: ComponentProps<CssGrid>["align"] = "center";
  export let as = false;
  export let nested = false;
</script>

{#if nested}
  <CssGrid data-testid="grid">
    <CssColumn>
      <CssGrid
        data-testid="subgrid"
        {narrow}
        {condensed}
        {fullWidth}
        {withRowGap}
        {align}
      >
        <CssColumn>
          <CssGrid data-testid="deep">Deep</CssGrid>
        </CssColumn>
      </CssGrid>
    </CssColumn>
  </CssGrid>
  <CssGrid data-testid="sibling">Sibling</CssGrid>
{:else if as}
  <CssGrid as {narrow} data-testid="grid" let:props>
    <main {...props}>Content</main>
  </CssGrid>
{:else}
  <CssGrid
    {narrow}
    {condensed}
    {fullWidth}
    {withRowGap}
    {align}
    data-testid="grid"
    aria-label="Layout"
  >
    Content
  </CssGrid>
{/if}
