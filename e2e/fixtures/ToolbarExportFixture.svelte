<script lang="ts">
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
    { key: "port", value: "Port", display: (port: number) => `${port} ms` },
  ];

  const names = [
    "Cherry",
    "Apple",
    "Banana",
    "Date",
    "Elderberry",
    "Fig",
    "Grape",
  ];
  const rows = names.map((name, index) => ({
    id: String(index),
    name,
    port: 3000 + index,
  }));

  let selectedRowIds: string[] = [];
  let page = 1;
  let pageSize = 5;
  let canceled = "";
</script>

<div data-testid="toolbar-export">
  <DataTable
    title="Fruit"
    {headers}
    {rows}
    sortable
    selectable
    batchSelection
    {page}
    {pageSize}
    bind:selectedRowIds
  >
    <Toolbar>
      <ToolbarBatchActions>
        <ToolbarExport
          labelText="Export selected"
          iconOnly={false}
          rowScope="selected"
          filename="selected"
        />
        <Button>Archive</Button>
      </ToolbarBatchActions>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows />
        <ToolbarExport
          labelText="Export page"
          rowScope="page"
          filename="page"
          formats={["csv"]}
        />
        <ToolbarExport
          filename="fruit"
          formats={["csv", "tsv", "json"]}
          on:export={(event) => {
            if (event.detail.format === "tsv") {
              event.preventDefault();
              canceled = event.detail.filename;
            }
          }}
        />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
  <Pagination bind:page bind:pageSize totalItems={rows.length} />
  <p data-testid="canceled">{canceled}</p>
</div>
