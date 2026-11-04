<script>
  import {
    Box,
    DataTable,
    defineFacets,
    facetCounts,
    FilterPanel,
    filterRecords,
    InlineLoading,
  } from "carbon-components-svelte";

  const services = [
    ["Db2 on Cloud", "Databases", "us-south"],
    ["Cloudant", "Databases", "eu-de"],
    ["Databases for PostgreSQL", "Databases", "jp-tok"],
    ["Event Streams", "Messaging", "us-south"],
    ["Code Engine", "Compute", "eu-de"],
    ["Kubernetes Service", "Compute", "jp-tok"],
    ["Virtual Server", "Compute", "us-south"],
    ["Key Protect", "Security", "us-south"],
  ].map(([name, category, region]) => ({ id: name, name, category, region }));

  const facets = defineFacets([
    {
      id: "category",
      label: "Category",
      type: "checkbox",
      options: ["Compute", "Databases", "Messaging", "Security"].map((id) => ({
        id,
      })),
    },
    {
      id: "region",
      label: "Region",
      type: "checkbox",
      options: [{ id: "us-south" }, { id: "eu-de" }, { id: "jp-tok" }],
    },
  ]);

  const headers = [
    { key: "name", value: "Service" },
    { key: "category", value: "Category" },
    { key: "region", value: "Region" },
  ];

  // For demo purposes only: a real app asks its API for these.
  async function search(filters) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const { total, counts } = facetCounts(services, facets, filters);
    return { total, counts, rows: filterRecords(services, facets, filters) };
  }

  let value = {};
  let counts;
  let total;
  let rows = services;
  let loading = false;

  async function load(filters) {
    loading = true;
    ({ total, counts, rows } = await search(filters));
    loading = false;
  }

  load(value);
</script>

<Box display="flex" gap={6}>
  <Box width="18rem">
    <FilterPanel
      {facets}
      bind:value
      {counts}
      resultCount={total}
      mode="batch"
      on:apply={(event) => load(event.detail)}
    />
  </Box>
  <Box grow minWidth={0}>
    {#if loading}
      <InlineLoading description="Loading results" />
    {/if}
    <DataTable size="short" {headers} {rows} />
  </Box>
</Box>
