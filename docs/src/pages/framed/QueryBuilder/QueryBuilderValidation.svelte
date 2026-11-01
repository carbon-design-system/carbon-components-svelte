<script>
  import {
    Button,
    QueryBuilder,
    Stack,
    validateQuery,
  } from "carbon-components-svelte";

  const fields = [
    { id: "name", text: "Account name", kind: "text" },
    { id: "seats", text: "Seats", kind: "number", min: 0, max: 10000 },
    { id: "renewal", text: "Renewal date", kind: "date" },
  ];

  let value = {
    operator: "and",
    conditions: [
      { field: "name", operator: "contains", value: "" },
      { field: "seats", operator: "between", value: [500, 100] },
    ],
  };
  let showErrors = false;
  let status = "";

  function handleSubmit() {
    showErrors = true;
    const { valid } = validateQuery(value, fields);
    status = valid ? "Saved" : "Fix the highlighted conditions to save.";
  }
</script>

<Stack gap={5}>
  <QueryBuilder labelText="Saved filter" {fields} {showErrors} bind:value />
  <Stack gap={5} orientation="horizontal">
    <Button on:click={handleSubmit}>Save filter</Button>
    <span aria-live="polite">{status}</span>
  </Stack>
</Stack>
