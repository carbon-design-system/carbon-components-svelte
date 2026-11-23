<script>
  import {
    Box,
    defineFacets,
    facetCounts,
    FilterPanel,
    RadioButton,
    RadioButtonGroup,
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
      options: [
        { id: "us-south" },
        { id: "eu-de" },
        { id: "jp-tok" },
        { id: "au-syd" },
      ],
    },
  ]);

  let zeroCounts = "disable";
  let value = { category: ["Messaging"] };

  $: ({ total, counts } = facetCounts(services, facets, value));
</script>

<Box display="flex" gap={6}>
  <Box width="18rem">
    <FilterPanel
      {facets}
      bind:value
      {counts}
      resultCount={total}
      {zeroCounts}
    />
  </Box>
  <RadioButtonGroup
    legendText="Options with no results"
    bind:selected={zeroCounts}
  >
    <RadioButton value="disable" labelText="Disable" />
    <RadioButton value="hide" labelText="Hide" />
  </RadioButtonGroup>
</Box>
