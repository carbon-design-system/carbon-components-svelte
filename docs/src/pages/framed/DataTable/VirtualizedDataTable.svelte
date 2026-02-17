<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const rows = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  let filteredRowIds = [];
</script>

<DataTable
  sortable
  virtualize={true}
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        persistent
        placeholder="Search 10,000 rows..."
        shouldFilterRows
        bind:filteredRowIds
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>
