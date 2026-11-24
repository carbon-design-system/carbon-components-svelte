<script>
  import { KeyValueEditor, Stack, toRecord } from "carbon-components-svelte";

  let rows = [
    { key: "NODE_ENV", value: "production" },
    { key: "LOG_LEVEL", value: "info" },
    {
      key: "DATABASE_URL",
      value: "postgres://db.internal:5432/orders",
      secret: true,
    },
  ];
</script>

<Stack gap={5}>
  <KeyValueEditor
    bind:rows
    format="env"
    labelText="Environment variables"
    helperText="Keys use letters, numbers and underscores."
    columns={["secret"]}
    addText="Add variable"
    keyPlaceholder="KEY"
    valuePlaceholder="value"
  />
  <pre>{JSON.stringify(toRecord(rows), null, 2)}</pre>
</Stack>
