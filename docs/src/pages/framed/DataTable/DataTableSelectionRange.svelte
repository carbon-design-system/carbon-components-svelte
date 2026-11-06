<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let selectedRowIds = [];

  const rows = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    port: [443, 3000, 80][i % 3],
    rule: i % 3 ? "Round robin" : "DNS delegation",
  }));
</script>

<DataTable
  batchSelection
  selectionRange
  sortable
  bind:selectedRowIds
  headers={[
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
  size="short"
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<p>{selectedRowIds.length} selected</p>
