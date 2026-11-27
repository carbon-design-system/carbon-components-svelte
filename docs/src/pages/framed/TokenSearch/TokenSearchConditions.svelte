<script>
  import {
    conditionsToQuery,
    keysToQueryFields,
    queryToConditions,
    Stack,
    TokenSearch,
  } from "carbon-components-svelte";

  const keys = [
    { key: "status", type: "enum", values: ["open", "closed", "draft"] },
    { key: "label", type: "enum", values: ["bug", "ui", "docs"] },
    { key: "comments", type: "number" },
    { key: "created", type: "date" },
  ];

  let value =
    "status:open -label:docs,ui comments:3..10 created:>=2026-01-01 crash";
  let query;

  // The condition tree of a `QueryBuilder`: an "and" group of conditions.
  $: converted = query ? queryToConditions(query, keys) : null;
  // And back: the text a tree says, with the free text kept beside it.
  $: written = converted
    ? conditionsToQuery(converted.group, keys, { text: converted.text })
    : null;
</script>

<Stack gap={5}>
  <TokenSearch
    bind:value
    bind:query
    {keys}
    labelText="Query"
    helperText="Free text has no place in the tree, so it is returned beside it"
  />
  <pre>{JSON.stringify(
      {
        fields: keysToQueryFields(keys).map((f) => `${f.id}: ${f.kind}`),
        group: converted?.group,
        text: converted?.text,
        skipped: converted?.skipped.length,
      },
      null,
      2,
    )}</pre>
  <pre>{written?.value}</pre>
</Stack>
