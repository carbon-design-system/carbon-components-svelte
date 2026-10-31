<script>
  import { DataGrid, Stack, Text } from "carbon-components-svelte";

  const hours = Array.from({ length: 49 }, (_, hour) => hour);

  const columns = [
    { key: "host", title: "Host", width: 140 },
    ...hours.map((hour) => ({
      key: `h${hour}`,
      title: `${String(hour % 24).padStart(2, "0")}:00`,
      width: 84,
      align: "end",
      format: (value) => `${value}%`,
    })),
  ];

  // 10,000 hosts by 49 hourly CPU readings: 500,000 cells.
  const rows = Array.from({ length: 10_000 }, (_, host) => {
    const row = { host: `host-${String(host + 1).padStart(5, "0")}` };
    for (const hour of hours) {
      row[`h${hour}`] = (host * 7 + hour * 13 + ((host * hour) % 17)) % 100;
    }
    return row;
  });

  let activeCell = { row: 0, column: 0 };
</script>

<Stack gap={5}>
  <DataGrid
    labelText="CPU use by host and hour"
    {columns}
    {rows}
    frozenColumns={1}
    height={360}
    bind:activeCell
  />
  <Text>
    {rows.length.toLocaleString("en-US")} rows by {columns.length} columns. Active
    cell: row {activeCell?.row + 1}, column {activeCell?.column + 1}.
  </Text>
</Stack>
