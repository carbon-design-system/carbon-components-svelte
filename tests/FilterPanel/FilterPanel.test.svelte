<script lang="ts">
  import AppliedFilters from "carbon-components-svelte/FilterPanel/AppliedFilters.svelte";
  import FilterPanel from "carbon-components-svelte/FilterPanel/FilterPanel.svelte";
  import {
    type Facet,
    facetCounts,
    filterRecords,
    type FilterState,
  } from "carbon-components-svelte/FilterPanel/filter-model.js";

  export let mode: "instant" | "batch" = "instant";
  export let zeroCounts: "disable" | "hide" = "disable";
  export let value: FilterState = {};
  export let withBar = false;
  export let announceDelay = 800;
  export let onchange: (event: CustomEvent) => void = () => {};
  export let onclear: (event: CustomEvent) => void = () => {};
  export let onapply: (event: CustomEvent) => void = () => {};

  const records = [
    { brand: "Acme", color: "red", price: 10 },
    { brand: "Acme", color: "blue", price: 20 },
    { brand: "Bolt", color: "red", price: 30 },
    { brand: "Core", color: "blue", price: 40 },
    { brand: "Dart", color: "red", price: 50 },
    { brand: "Echo", color: "blue", price: 60 },
    { brand: "Fuse", color: "red", price: 70 },
  ];

  const facets: Facet[] = [
    {
      id: "brand",
      label: "Brand",
      type: "checkbox",
      limit: 3,
      searchable: true,
      options: ["Acme", "Bolt", "Core", "Dart", "Echo", "Fuse", "Ghost"].map(
        (id) => ({ id }),
      ),
    },
    {
      id: "color",
      label: "Color",
      type: "radio",
      options: [{ id: "red" }, { id: "blue" }],
    },
    { id: "price", label: "Price", type: "range", min: 0, max: 100 },
  ];

  let draft: FilterState = {};
  $: preview = facetCounts(records, facets, draft);
  $: results = filterRecords(records, facets, value);
</script>

<FilterPanel
  {facets}
  bind:value
  bind:draft
  {mode}
  {zeroCounts}
  {announceDelay}
  counts={preview.counts}
  resultCount={mode === "batch" ? results.length : preview.total}
  data-testid="panel"
  on:change={onchange}
  on:apply={onapply}
  on:clear={onclear}
/>
{#if withBar}
  <AppliedFilters {facets} bind:value data-testid="bar" />
{/if}
<output data-testid="value">{JSON.stringify(value)}</output>
<output data-testid="draft">{JSON.stringify(draft)}</output>
