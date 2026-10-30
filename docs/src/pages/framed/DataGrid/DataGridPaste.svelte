<script>
  import {
    applyDataGridPaste,
    DataGrid,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const columns = [
    { key: "service", title: "Service", width: 160 },
    { key: "replicas", title: "Replicas", width: 110, align: "end" },
    { key: "cpu", title: "CPU (millicores)", width: 150, align: "end" },
    { key: "memory", title: "Memory (MiB)", width: 140, align: "end" },
  ];

  let rows = [
    { service: "billing-api", replicas: 3, cpu: 500, memory: 512 },
    { service: "checkout", replicas: 4, cpu: 750, memory: 1024 },
    { service: "identity", replicas: 2, cpu: 250, memory: 256 },
    { service: "inventory", replicas: 2, cpu: 500, memory: 768 },
    { service: "search", replicas: 6, cpu: 1000, memory: 2048 },
    { service: "webhooks", replicas: 1, cpu: 250, memory: 256 },
  ];

  let message = "Copy cells from a spreadsheet and paste them into the grid.";

  function handlePaste(event) {
    const { matrix, range, truncated } = event.detail;

    // Only the numeric columns take pasted values.
    const numeric = matrix.every((line) =>
      line.every((text, j) => {
        const key = columns[range.startColumn + j]?.key;
        return key === "service" || Number.isFinite(Number(text));
      }),
    );
    if (!numeric) {
      message = "Rejected: a pasted value is not a number.";
      event.preventDefault();
      return;
    }

    // The grid never edits a row. Write the values, then reassign `rows`.
    rows = applyDataGridPaste(rows, columns, event.detail, (text, column) =>
      column.key === "service" ? text : Number(text),
    );
    message = truncated
      ? "Pasted what fits. The rest ran past the grid."
      : `Pasted ${matrix.length} by ${matrix[0].length} cells.`;
  }
</script>

<Stack gap={5}>
  <DataGrid
    labelText="Service resources"
    {columns}
    {rows}
    on:paste={handlePaste}
  />
  <Text>{message}</Text>
</Stack>
