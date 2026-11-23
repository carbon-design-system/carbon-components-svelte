<script>
  import {
    AppliedFilters,
    Box,
    DataTable,
    defineFacets,
    facetCounts,
    FilterPanel,
    filterRecords,
    Stack,
  } from "carbon-components-svelte";

  const services = [
    ["Db2 on Cloud", "Databases", "us-south", 240],
    ["Cloudant", "Databases", "eu-de", 180],
    ["Event Streams", "Messaging", "us-south", 620],
    ["Code Engine", "Compute", "eu-de", 0],
    ["Kubernetes Service", "Compute", "jp-tok", 890],
    ["Virtual Server", "Compute", "us-south", 310],
    ["Key Protect", "Security", "us-south", 60],
    ["Load Balancer", "Networking", "us-south", 210],
  ].map(([name, category, region, cost]) => ({
    id: name,
    name,
    category,
    region,
    cost,
  }));

  const facets = defineFacets([
    {
      id: "category",
      label: "Category",
      type: "checkbox",
      options: [
        "Compute",
        "Databases",
        "Messaging",
        "Networking",
        "Security",
      ].map((id) => ({ id })),
    },
    {
      id: "region",
      label: "Region",
      type: "checkbox",
      options: [{ id: "us-south" }, { id: "eu-de" }, { id: "jp-tok" }],
    },
    {
      id: "cost",
      label: "Monthly cost",
      type: "range",
      min: 0,
      max: 1000,
      step: 10,
      format: (n) => `$${n}`,
    },
  ]);

  const headers = [
    { key: "name", value: "Service" },
    { key: "category", value: "Category" },
    { key: "region", value: "Region" },
    { key: "cost", value: "Cost" },
  ];

  let value = {
    category: ["Compute", "Databases"],
    region: ["us-south", "eu-de"],
    cost: [null, 500],
  };

  $: ({ total, counts } = facetCounts(services, facets, value));
  $: rows = filterRecords(services, facets, value);
</script>

<Box display="flex" gap={6}>
  <Box width="18rem">
    <FilterPanel {facets} bind:value {counts} resultCount={total} />
  </Box>
  <Box grow minWidth={0}>
    <Stack gap={4}>
      <AppliedFilters {facets} bind:value />
      <DataTable size="short" {headers} {rows} />
    </Stack>
  </Box>
</Box>
