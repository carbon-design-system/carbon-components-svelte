<script>
  import {
    Box,
    DataTable,
    defineFacets,
    facetCounts,
    FilterPanel,
    filterRecords,
  } from "carbon-components-svelte";

  const services = [
    ["Db2 on Cloud", "Databases", "us-south", "Standard"],
    ["Cloudant", "Databases", "eu-de", "Standard"],
    ["Databases for PostgreSQL", "Databases", "jp-tok", "Standard"],
    ["Event Streams", "Messaging", "us-south", "Premium"],
    ["Code Engine", "Compute", "eu-de", "Lite"],
    ["Kubernetes Service", "Compute", "jp-tok", "Premium"],
    ["Virtual Server", "Compute", "us-south", "Standard"],
    ["Cloud Object Storage", "Storage", "eu-de", "Standard"],
    ["Block Storage", "Storage", "jp-tok", "Standard"],
    ["Key Protect", "Security", "us-south", "Standard"],
    ["App ID", "Security", "jp-tok", "Lite"],
    ["Load Balancer", "Networking", "us-south", "Standard"],
  ].map(([name, category, region, plan]) => ({
    id: name,
    name,
    category,
    region,
    plan,
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
        "Storage",
      ].map((id) => ({ id })),
    },
    {
      id: "region",
      label: "Region",
      type: "checkbox",
      options: [{ id: "us-south" }, { id: "eu-de" }, { id: "jp-tok" }],
    },
    {
      id: "plan",
      label: "Plan",
      type: "radio",
      options: [{ id: "Lite" }, { id: "Standard" }, { id: "Premium" }],
    },
  ]);

  const headers = [
    { key: "name", value: "Service" },
    { key: "category", value: "Category" },
    { key: "region", value: "Region" },
    { key: "plan", value: "Plan" },
  ];

  let value = {};

  $: ({ total, counts } = facetCounts(services, facets, value));
  $: rows = filterRecords(services, facets, value);
</script>

<Box display="flex" gap={6}>
  <Box width="18rem">
    <FilterPanel {facets} bind:value {counts} resultCount={total} />
  </Box>
  <Box grow minWidth={0}>
    <DataTable size="short" {headers} {rows} />
  </Box>
</Box>
