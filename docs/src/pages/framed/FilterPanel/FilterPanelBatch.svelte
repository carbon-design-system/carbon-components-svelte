<script>
  import {
    Box,
    defineFacets,
    facetCounts,
    FilterPanel,
    Stack,
  } from "carbon-components-svelte";

  const services = [
    ["Db2 on Cloud", "Databases", "us-south"],
    ["Cloudant", "Databases", "eu-de"],
    ["Event Streams", "Messaging", "us-south"],
    ["Code Engine", "Compute", "eu-de"],
    ["Kubernetes Service", "Compute", "jp-tok"],
    ["Key Protect", "Security", "us-south"],
  ].map(([name, category, region]) => ({ name, category, region }));

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

  let value = {};
  let draft = {};
  let applied = 0;

  // The count follows the draft, so Apply shows what it will return.
  $: ({ total, counts } = facetCounts(services, facets, draft));
</script>

<Box display="flex" gap={6}>
  <Box width="18rem">
    <FilterPanel
      {facets}
      bind:value
      bind:draft
      {counts}
      resultCount={total}
      mode="batch"
      on:apply={() => (applied += 1)}
    />
  </Box>
  <Stack gap={3}>
    <div>Applied {applied} {applied === 1 ? "time" : "times"}</div>
    <div>Applied filters: {JSON.stringify(value)}</div>
    <div>Draft: {JSON.stringify(draft)}</div>
  </Stack>
</Box>
