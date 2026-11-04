<script lang="ts">
  import FilterFlyout from "carbon-components-svelte/FilterPanel/FilterFlyout.svelte";
  import FilterPanel from "carbon-components-svelte/FilterPanel/FilterPanel.svelte";

  let open = false;
  let flyout = false;
  const facets = [
    {
      id: "brand",
      label: "Brand",
      type: "checkbox" as const,
      options: [{ id: "Acme" }],
    },
  ];
  let value = {};
</script>

{#if flyout}
  <button type="button" on:click={() => (open = true)}>Filter</button>
{/if}
<FilterFlyout bind:open bind:flyout>
  <FilterPanel {facets} bind:value hideTitle />
</FilterFlyout>
<output data-testid="flyout">{flyout}</output>
<output data-testid="open">{open}</output>
