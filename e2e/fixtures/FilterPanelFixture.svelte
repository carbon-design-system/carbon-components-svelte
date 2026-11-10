<script>
  import {
    AppliedFilters,
    Button,
    DataTable,
    deriveFacetOptions,
    facetCounts,
    FilterFlyout,
    FilterPanel,
    filterRecords,
    fromSearchParams,
    Pagination,
    Toolbar,
    ToolbarContent,
    toSearchParams,
  } from "carbon-components-svelte";
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";

  // `?n=50000` sizes the data set, `?mode=batch` waits for Apply,
  // `?zero=hide` removes empty options, `?view=list` swaps the table for a
  // plain list, `?url=1` keeps the filters in the query string,
  // `?brands=500` sets how many brands the first facet lists.
  const query = new URLSearchParams(
    typeof location === "undefined" ? "" : location.search,
  );
  const size = Number(query.get("n") ?? 400);
  const brands = Number(query.get("brands") ?? 12);
  const mode = query.get("mode") === "batch" ? "batch" : "instant";
  const zeroCounts = query.get("zero") === "hide" ? "hide" : "disable";
  const view = query.get("view") === "list" ? "list" : "table";
  const syncUrl = query.get("url") === "1";

  let seed = 7;
  function random() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }
  /** @param {string[]} list */
  function pick(list) {
    return list[Math.floor(random() * list.length)];
  }

  const brandNames = Array.from({ length: brands }, (_, i) => `Brand ${i + 1}`);
  const colors = ["Red", "Blue", "Green", "Black", "White", "Grey"];
  const tags = ["new", "sale", "eco", "bundle", "limited"];
  const categories = ["phones", "tablets", "laptops", "cases", "chargers"];

  const records = Array.from({ length: size }, (_, i) => ({
    id: String(i),
    name: `Item ${i + 1}`,
    brand: pick(brandNames),
    color: pick(colors),
    size: pick(["XS", "S", "M", "L", "XL"]),
    tags: [pick(tags), pick(tags)].filter((t, k, all) => all.indexOf(t) === k),
    price: Math.round(random() * 1000),
    stock: random() > 0.3,
    added: `2026-0${1 + Math.floor(random() * 9)}-1${Math.floor(random() * 9)}`,
    category: pick(categories),
  }));

  const facets = deriveFacetOptions(records, [
    { id: "brand", label: "Brand", type: "checkbox" },
    { id: "color", label: "Color", type: "radio", options: [] },
    { id: "size", label: "Size", type: "checkbox" },
    { id: "tags", label: "Tags", type: "checkbox", match: "all" },
    {
      id: "price",
      label: "Price",
      type: "range",
      min: 0,
      max: 1000,
      step: 10,
      format: (n) => `$${n}`,
    },
    {
      id: "stock",
      label: "Availability",
      type: "toggle",
      toggleLabel: "In stock only",
    },
    { id: "added", label: "Added", type: "date", collapsed: true },
    {
      id: "category",
      label: "Category",
      type: "tree",
      collapsed: true,
      options: [
        {
          id: "devices",
          label: "Devices",
          children: [
            { id: "phones", label: "Phones" },
            { id: "tablets", label: "Tablets" },
            { id: "laptops", label: "Laptops" },
          ],
        },
        {
          id: "accessories",
          label: "Accessories",
          children: [
            { id: "cases", label: "Cases" },
            { id: "chargers", label: "Chargers" },
          ],
        },
      ],
    },
  ]);

  const headers = [
    { key: "name", value: "Name" },
    { key: "brand", value: "Brand" },
    { key: "color", value: "Color" },
    { key: "price", value: "Price" },
  ];

  let value = syncUrl ? fromSearchParams(facets, location.search) : {};
  let draft = {};
  let open = false;
  let flyout = false;
  let page = 1;

  $: filtered = filterRecords(records, facets, value);
  $: preview = facetCounts(records, facets, draft);
  $: if (syncUrl && typeof history !== "undefined") {
    const params = toSearchParams(facets, value);
    const search = params.toString();
    history.replaceState(
      null,
      "",
      `${location.pathname}${search ? `?${search}` : ""}`,
    );
  }
  $: if (page > Math.max(1, Math.ceil(filtered.length / 10))) page = 1;
</script>

<div class="fixture" data-testid="fixture">
  <FilterFlyout bind:open bind:flyout>
    <FilterPanel
      {facets}
      bind:value
      bind:draft
      {mode}
      {zeroCounts}
      counts={preview.counts}
      maxOptions={Number(query.get("cap") ?? 100)}
      resultCount={mode === "batch" ? filtered.length : preview.total}
      on:apply={() => (open = false)}
    />
  </FilterFlyout>
  <main class="results" aria-label="Results">
    <div class="bar">
      {#if flyout}
        <Button
          kind="tertiary"
          size="sm"
          icon={Filter}
          aria-expanded={open}
          on:click={() => (open = true)}>Filter</Button
        >
      {/if}
      <span data-testid="row-count"
        >{filtered.length} of {records.length} rows</span
      >
    </div>
    <AppliedFilters {facets} bind:value />
    {#if view === "table"}
      <DataTable size="short" {headers} rows={filtered} {page} pageSize={10}>
        <Toolbar size="sm"><ToolbarContent /></Toolbar>
      </DataTable>
      <Pagination
        bind:page
        pageSize={10}
        totalItems={filtered.length}
        pageSizes={[10]}
      />
    {:else}
      <ul data-testid="list">
        {#each filtered.slice(0, 20) as row (row.id)}
          <li>{row.name} {row.brand}</li>
        {/each}
      </ul>
    {/if}
  </main>
</div>

<style>
  .fixture {
    display: flex;
    min-block-size: 100vh;
  }
  .results {
    flex: 1;
    min-inline-size: 0;
    padding: 1rem;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-block-end: 0.5rem;
  }
</style>
