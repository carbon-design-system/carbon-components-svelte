<script lang="ts">
  import AppliedFilters from "carbon-components-svelte/FilterPanel/AppliedFilters.svelte";
  import FilterFlyout from "carbon-components-svelte/FilterPanel/FilterFlyout.svelte";
  import FilterPanel from "carbon-components-svelte/FilterPanel/FilterPanel.svelte";
  import {
    type Facet,
    facetCounts,
    fromSearchParams,
  } from "carbon-components-svelte/FilterPanel/filter-model.js";

  export let search = "";

  const records = [
    { brand: "Acme", color: "red", price: 10 },
    { brand: "Bolt", color: "blue", price: 30 },
    { brand: "Bolt", color: "red", price: 50 },
  ];
  const facets: Facet[] = [
    {
      id: "brand",
      label: "Brand",
      type: "checkbox",
      options: [{ id: "Acme" }, { id: "Bolt" }],
    },
    {
      id: "color",
      label: "Color",
      type: "radio",
      options: [{ id: "red" }, { id: "blue" }],
    },
    { id: "price", label: "Price", type: "range", min: 0, max: 100 },
  ];

  let value = fromSearchParams(facets, search);
  $: result = facetCounts(records, facets, value);
</script>

<FilterFlyout>
  <FilterPanel
    {facets}
    bind:value
    counts={result.counts}
    resultCount={result.total}
    data-testid="panel"
  />
</FilterFlyout>
<AppliedFilters {facets} bind:value />
