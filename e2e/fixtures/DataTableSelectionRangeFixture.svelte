<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "score", value: "Score" },
  ];

  // The score is a permutation of 0..9999, so a sort by score is a shuffle of
  // the names and a range in sorted order is not a range in source order.
  const rows = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Row ${i}`,
    score: (i * 7919) % 10007,
  }));

  const params = new URLSearchParams(location.search);
  const count = Number(params.get("rows") ?? rows.length);

  let selectedRowIds = [];
  let sortKey = params.get("sort") ?? undefined;
  let sortDirection = params.get("sort") ? "ascending" : "none";
</script>

<div data-testid="selection-range-root">
  <DataTable
    {headers}
    rows={rows.slice(0, count)}
    selectable
    selectionRange
    sortable
    bind:selectedRowIds
    bind:sortKey
    bind:sortDirection
    virtualize={{
      threshold: 10,
      maxVisibleRows: 8,
      itemHeight: 48,
      overscan: 3,
    }}
    title="Servers"
  >
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
  <output data-testid="selected-count">{selectedRowIds.length}</output>
  <output data-testid="selected-ids">{selectedRowIds.join(",")}</output>
</div>
