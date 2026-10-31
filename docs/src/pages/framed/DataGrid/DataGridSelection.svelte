<script>
  import { DataGrid, Stack, Text } from "carbon-components-svelte";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const services = [
    "billing-api",
    "checkout",
    "identity",
    "inventory",
    "notifications",
    "search",
    "shipping",
    "webhooks",
  ];

  const columns = [
    { key: "service", title: "Service", width: 150 },
    ...months.map((month) => ({
      key: month,
      title: month,
      width: 96,
      align: "end",
      format: (value) => `$${value.toLocaleString("en-US")}`,
    })),
  ];

  const rows = services.map((service, i) => ({
    service,
    ...Object.fromEntries(
      months.map((month, j) => [month, 1200 + ((i * 317 + j * 89) % 2400)]),
    ),
  }));

  let activeCell = { row: 0, column: 0 };
  let selection = null;

  $: total = selection
    ? rows
        .slice(selection.startRow, selection.endRow + 1)
        .flatMap((row) =>
          columns
            .slice(selection.startColumn, selection.endColumn + 1)
            .map((column) => row[column.key]),
        )
        .filter((value) => typeof value === "number")
        .reduce((sum, value) => sum + value, 0)
    : 0;
</script>

<Stack gap={5}>
  <DataGrid
    labelText="Monthly spend by service"
    {columns}
    {rows}
    frozenColumns={1}
    bind:activeCell
    bind:selection
  />
  <Text>
    {#if selection}
      Selected {selection.endRow - selection.startRow + 1} by {selection.endColumn -
        selection.startColumn +
        1} cells, ${total.toLocaleString("en-US")} in total.
    {:else}
      Active cell: row {activeCell.row + 1}, column {activeCell.column + 1}.
    {/if}
  </Text>
</Stack>
