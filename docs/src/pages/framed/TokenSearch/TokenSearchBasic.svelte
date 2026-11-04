<script>
  import { Stack, TokenSearch } from "carbon-components-svelte";

  const keys = [
    {
      key: "is",
      label: "State",
      type: "enum",
      values: [
        { value: "open", description: "Not yet closed" },
        { value: "closed", description: "Done or dropped" },
        { value: "draft", description: "Not ready for review" },
      ],
    },
    {
      key: "label",
      type: "enum",
      values: ["bug", "ui", "docs", "wontfix", "good first issue"],
    },
    { key: "created", label: "Created", type: "date" },
    { key: "comments", label: "Comments", type: "number" },
    { key: "title", label: "Title", type: "text" },
  ];

  let value =
    'is:open label:bug -label:wontfix created:>=@today-30d "exact phrase"';
  let query;
</script>

<Stack gap={5}>
  <TokenSearch
    bind:value
    bind:query
    {keys}
    labelText="Search issues"
    placeholder="Search issues, or type a key such as is:"
    helperText="Type a key, then its value. Press ArrowDown to open the suggestions."
  />
  <pre>{JSON.stringify(
      {
        text: query?.text,
        filters: query?.filters.map(({ key, op, values, negated }) => ({
          key,
          op,
          values,
          negated,
        })),
        errors: query?.errors.map((e) => e.code),
      },
      null,
      2,
    )}</pre>
</Stack>
