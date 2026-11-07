<script>
  import { Stack, TokenSearch } from "carbon-components-svelte";

  const keys = [
    { key: "created", label: "Created", type: "date" },
    { key: "updated", label: "Updated", type: "date" },
  ];

  // Shortcuts for the dates. `operand` ones are also offered after an
  // operator the user typed, such as `created:>`.
  const datePresets = [
    { label: "Today", value: "@today", operand: true },
    { label: "Yesterday", value: "@yesterday", operand: true },
    { label: "Last 14 days", value: ">=@today-14d" },
    { label: "This quarter", value: ">=@today-3m" },
  ];

  let value = "created:";
  let query;
</script>

<Stack gap={5}>
  <TokenSearch
    bind:value
    bind:query
    {keys}
    {datePresets}
    labelText="Search issues"
    helperText="Try created:>=@today-7d, updated:2026-01-01..2026-02-01 or created:@yesterday"
  />
  <pre>{JSON.stringify(
      query?.filters.map(({ key, op, values }) => ({ key, op, values })),
      null,
      2,
    )}</pre>
</Stack>
