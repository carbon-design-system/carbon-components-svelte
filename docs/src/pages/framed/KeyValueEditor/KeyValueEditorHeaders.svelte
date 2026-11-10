<script>
  import {
    KeyValueEditor,
    serializeHeaders,
    Stack,
  } from "carbon-components-svelte";

  let rows = [
    { key: "Accept", value: "application/json" },
    { key: "Content-Type", value: "application/json" },
    { key: "X-Request-Id", value: "7f1c2e90", enabled: false },
  ];
</script>

<Stack gap={5}>
  <KeyValueEditor
    bind:rows
    format="headers"
    addMode="ghost"
    duplicateKeys="warn"
    columns={["enabled"]}
    labelText="Request headers"
    helperText="Type in the empty line to add a header. Headers that are switched off are not sent."
    keyPlaceholder="Header"
    valuePlaceholder="Value"
  />
  <pre>{serializeHeaders(rows)}</pre>
</Stack>
