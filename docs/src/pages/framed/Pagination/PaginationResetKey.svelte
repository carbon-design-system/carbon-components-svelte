<script>
  import {
    DataTable,
    Pagination,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let rows = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
  }));
  let pageSize = 10;
  let page = 1;
  let value = "";
  let filteredRowIds = [];
</script>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
  ]}
  {rows}
  {pageSize}
  {page}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        persistent
        shouldFilterRows
        bind:value
        bind:filteredRowIds
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<Pagination
  bind:pageSize
  bind:page
  totalItems={filteredRowIds.length}
  resetKey={value}
  pageSizeInputDisabled
/>
