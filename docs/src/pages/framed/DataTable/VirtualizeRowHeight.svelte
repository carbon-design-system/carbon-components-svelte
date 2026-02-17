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
  }));

  let filteredRowIds = [];
</script>

<DataTable
  sortable
  virtualize={{ itemHeight: 20 }}
  rowClass="virtualize-tall-row"
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
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

<style>
  :global(.bx--data-table-container tbody tr.virtualize-tall-row) {
    height: 24px;
  }
</style>
