<script>
  import {
    DataTable,
    Pagination,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let rows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
  let pageSize = 5;
  let page = 1;
  let filteredRowIds = [];

  $: console.log("filteredRowIds", filteredRowIds);
</script>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
  {pageSize}
  {page}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        persistent
        value="round"
        shouldFilterRows={(row, value) => {
          return (
            /(6|8)$/.test(row.name) &&
            row.rule.toLowerCase().includes(value.toLowerCase())
          );
        }}
        bind:filteredRowIds
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<Pagination
  bind:pageSize
  bind:page
  totalItems={filteredRowIds.length}
  pageSizeInputDisabled
/>
