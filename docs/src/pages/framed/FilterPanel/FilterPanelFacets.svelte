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
    [
      "Db2 on Cloud",
      "Databases",
      "Standard",
      240,
      true,
      "2024-03-12",
      ["sql", "managed"],
    ],
    ["Cloudant", "Databases", "Standard", 180, true, "2023-11-02", ["managed"]],
    [
      "Event Streams",
      "Messaging",
      "Premium",
      620,
      true,
      "2024-06-20",
      ["managed"],
    ],
    [
      "Code Engine",
      "Compute",
      "Lite",
      0,
      true,
      "2024-01-15",
      ["serverless", "containers"],
    ],
    [
      "Kubernetes Service",
      "Compute",
      "Premium",
      890,
      true,
      "2022-09-08",
      ["containers", "managed"],
    ],
    ["Virtual Server", "Compute", "Standard", 310, true, "2021-05-30", []],
    [
      "Cloud Object Storage",
      "Storage",
      "Standard",
      95,
      true,
      "2020-02-14",
      ["managed"],
    ],
    ["Block Storage", "Storage", "Standard", 130, true, "2021-08-19", []],
    [
      "Key Protect",
      "Security",
      "Standard",
      60,
      true,
      "2022-04-27",
      ["managed"],
    ],
    [
      "Secrets Manager",
      "Security",
      "Lite",
      0,
      false,
      "2025-02-03",
      ["managed"],
    ],
    ["Watson Studio", "AI", "Premium", 980, false, "2025-04-22", ["managed"]],
    [
      "Satellite",
      "Compute",
      "Premium",
      1200,
      false,
      "2025-05-14",
      ["containers"],
    ],
  ].map(([name, category, plan, cost, available, released, tags]) => ({
    id: name,
    name,
    category,
    plan,
    cost,
    available,
    released,
    tags,
  }));

  const facets = defineFacets([
    // A checkbox facet lists its options with a count each. Set `match: "all"`
    // to keep the services that carry every checked tag.
    {
      id: "tags",
      label: "Tags",
      type: "checkbox",
      match: "all",
      options: ["containers", "managed", "serverless", "sql"].map((id) => ({
        id,
      })),
    },
    // A radio facet takes one value, and Any clears it.
    {
      id: "plan",
      label: "Plan",
      type: "radio",
      options: [{ id: "Lite" }, { id: "Standard" }, { id: "Premium" }],
    },
    // A range pairs a slider with two inputs.
    {
      id: "cost",
      label: "Monthly cost",
      type: "range",
      min: 0,
      max: 1200,
      step: 20,
      format: (n) => `$${n}`,
    },
    // A date range takes YYYY-MM-DD.
    { id: "released", label: "Released", type: "date", collapsed: true },
    {
      id: "available",
      label: "Availability",
      type: "toggle",
      toggleLabel: "Generally available",
    },
    // A tree checks a branch for all of its children.
    {
      id: "category",
      label: "Category",
      type: "tree",
      collapsed: true,
      options: [
        {
          id: "infrastructure",
          label: "Infrastructure",
          children: [{ id: "Compute" }, { id: "Storage" }],
        },
        { id: "Databases" },
        { id: "Messaging" },
        { id: "Security" },
        { id: "AI" },
      ],
    },
  ]);

  const headers = [
    { key: "name", value: "Service" },
    { key: "category", value: "Category" },
    { key: "plan", value: "Plan" },
    { key: "cost", value: "Cost" },
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
