<script>
  import {
    AppliedFilters,
    Box,
    Button,
    DataTable,
    defineFacets,
    facetCounts,
    FilterFlyout,
    FilterPanel,
    filterRecords,
    Stack,
    Toolbar,
    ToolbarContent,
  } from "carbon-components-svelte";
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";

  const services = [
    ["Db2 on Cloud", "Databases", "us-south", "Standard", 240],
    ["Cloudant", "Databases", "eu-de", "Standard", 180],
    ["Databases for PostgreSQL", "Databases", "jp-tok", "Standard", 275],
    ["Event Streams", "Messaging", "us-south", "Premium", 620],
    ["Code Engine", "Compute", "eu-de", "Lite", 0],
    ["Kubernetes Service", "Compute", "jp-tok", "Premium", 890],
    ["Virtual Server", "Compute", "us-south", "Standard", 310],
    ["Cloud Object Storage", "Storage", "eu-de", "Standard", 95],
    ["Block Storage", "Storage", "jp-tok", "Standard", 130],
    ["Key Protect", "Security", "us-south", "Standard", 60],
    ["App ID", "Security", "jp-tok", "Lite", 0],
    ["Load Balancer", "Networking", "us-south", "Standard", 210],
  ].map(([name, category, region, plan, cost]) => ({
    id: name,
    name,
    category,
    region,
    plan,
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
    { key: "plan", value: "Plan" },
    { key: "cost", value: "Monthly cost" },
  ];

  let value = {};
  let open = false;
  let flyout = false;

  $: ({ total, counts } = facetCounts(services, facets, value));
  $: rows = filterRecords(services, facets, value);
</script>

<Box display="flex" gap={6}>
  <FilterFlyout bind:open bind:flyout>
    <FilterPanel
      {facets}
      bind:value
      {counts}
      resultCount={total}
      on:clear={() => (open = false)}
    />
  </FilterFlyout>
  <Box grow minWidth={0}>
    <Stack gap={4}>
      <AppliedFilters {facets} bind:value />
      <DataTable
        size="short"
        title="Services"
        description="{rows.length} of {services.length} services"
        {headers}
        {rows}
      >
        <Toolbar>
          <ToolbarContent>
            {#if flyout}
              <Button
                kind="ghost"
                icon={Filter}
                aria-expanded={open}
                on:click={() => (open = true)}
              >
                Filter
              </Button>
            {/if}
          </ToolbarContent>
        </Toolbar>
      </DataTable>
    </Stack>
  </Box>
</Box>
