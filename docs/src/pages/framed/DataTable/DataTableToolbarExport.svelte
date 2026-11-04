<script>
  import {
    Button,
    DataTable,
    Pagination,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarExport,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${12 - i}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  let page = 1;
  let pageSize = 5;
  let selectedRowIds = [];
</script>

<DataTable
  sortable
  batchSelection
  {headers}
  {rows}
  {page}
  {pageSize}
  bind:selectedRowIds
>
  <Toolbar>
    <ToolbarBatchActions>
      <ToolbarExport
        iconOnly={false}
        labelText="Export selected"
        rowScope="selected"
        filename="selected-load-balancers"
      />
      <Button>Delete</Button>
    </ToolbarBatchActions>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows />
      <ToolbarExport filename="load-balancers" />
    </ToolbarContent>
  </Toolbar>
</DataTable>
<Pagination bind:page bind:pageSize totalItems={rows.length} />
