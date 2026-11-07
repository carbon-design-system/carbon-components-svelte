<script>
  import {
    Box,
    DataTable,
    defineFacets,
    facetCounts,
    FilterPanel,
    filterRecords,
    fromSearchParams,
    toSearchParams,
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
    },
  ]);

  const headers = [
    { key: "name", value: "Service" },
    { key: "category", value: "Category" },
    { key: "region", value: "Region" },
    { key: "cost", value: "Cost" },
  ];

  // Read the filters from the address once. On a server, pass the request's
  // `url.searchParams` here instead, and the first render has them.
  const initial = typeof window === "undefined" ? "" : window.location.search;

  let value = fromSearchParams(facets, initial);
  let search = initial;

  // Write them back without adding a history entry. A parameter the facets
  // don't own, such as `page` or `sort`, stays as it is.
  function replaceFilters(filters) {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    for (const facet of facets) params.delete(facet.id);
    for (const [name, text] of toSearchParams(facets, filters)) {
      params.append(name, text);
    }
    const query = params.toString();
    const href = `${window.location.pathname}${query ? `?${query}` : ""}`;
    history.replaceState(
      {
        ...history.state,
        // docs-only:start
        // Opt out of this docs site's router, which intercepts history calls.
        useRoutify: false,
        // docs-only:end
      },
      "",
      href,
    );
    search = query;
  }

  $: replaceFilters(value);
  $: ({ total, counts } = facetCounts(services, facets, value));
  $: rows = filterRecords(services, facets, value);
</script>

<Box display="flex" gap={6}>
  <Box width="18rem">
    <FilterPanel {facets} bind:value {counts} resultCount={total} />
  </Box>
  <Box grow minWidth={0}>
    <p>Query string: <code>{search || "(empty)"}</code></p>
    <DataTable size="short" {headers} {rows} />
  </Box>
</Box>
