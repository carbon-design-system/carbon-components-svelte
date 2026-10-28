<script>
  import { QueryBuilder, Stack } from "carbon-components-svelte";

  const fields = [
    { id: "name", label: "Account name", kind: "text" },
    { id: "seats", label: "Seats", kind: "number", min: 0 },
    { id: "renewal", label: "Renewal date", kind: "date" },
    {
      id: "plan",
      label: "Plan",
      kind: "option",
      options: [
        { id: "free", text: "Free" },
        { id: "team", text: "Team" },
        { id: "enterprise", text: "Enterprise" },
      ],
    },
    { id: "active", label: "Active", kind: "boolean" },
  ];

  let value = {
    operator: "and",
    conditions: [
      { field: "plan", operator: "isAnyOf", value: ["team", "enterprise"] },
      { field: "seats", operator: "gte", value: 50 },
    ],
  };
</script>

<Stack gap={5}>
  <QueryBuilder
    labelText="Accounts"
    helperText="Match accounts that meet the conditions below."
    {fields}
    bind:value
  />
  <pre>{JSON.stringify(value, null, 2)}</pre>
</Stack>
