<script>
  import {
    Box,
    CodeSnippet,
    defineFacets,
    FilterPanel,
    fromConditions,
    Stack,
    toConditions,
    toQuery,
  } from "carbon-components-svelte";

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
      id: "cost",
      label: "Monthly cost",
      type: "range",
      min: 0,
      max: 1000,
      step: 10,
    },
    {
      id: "available",
      label: "Availability",
      type: "toggle",
      toggleLabel: "Generally available",
    },
  ]);

  let value = { category: ["Compute", "Databases"], cost: [100, null] };

  // The same filters as a TokenSearch query and as a QueryBuilder tree.
  $: query = toQuery(facets, value);
  $: tree = toConditions(facets, value);
  // And back: what the facets cannot show comes back in `skipped`.
  $: ({ state, skipped } = fromConditions(facets, tree));
</script>

<Box display="flex" gap={6}>
  <Box width="18rem">
    <FilterPanel {facets} bind:value />
  </Box>
  <Stack gap={5}>
    <CodeSnippet type="multi" code={JSON.stringify(query, null, 2)} />
    <CodeSnippet type="multi" code={JSON.stringify(tree, null, 2)} />
    <CodeSnippet
      type="multi"
      code={JSON.stringify({ state, skipped }, null, 2)}
    />
  </Stack>
</Box>
