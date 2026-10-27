<script lang="ts">
  import {
    Button,
    createTableState,
    DataTable,
    Pagination,
    tableStateToSearchParams,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ] as const;

  const names = [
    "Banana",
    "apple",
    "Cherry",
    "banana split",
    "Apricot",
    "cherry pie",
    "Date",
    "elderberry",
    "Fig",
    "grape",
    "Honeydew",
    "kiwi",
  ];
  const all = names.map((name, index) => ({
    id: String(index),
    name,
    port: 3000 - index * 7,
  }));

  const table = createTableState(
    { pageSize: 5 },
    {
      url: true,
      persist: { key: "e2e-table-state", pick: ["pageSize"] },
      pageSizes: [5, 10],
      sortKeys: ["name", "port"],
    },
  );

  // A server: it orders names by code point and pages its result.
  function fetchPage(query: string, key: string | null, direction: string) {
    let matched = all.filter((row) =>
      row.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (key && direction !== "none") {
      const sign = direction === "ascending" ? 1 : -1;
      matched = [...matched].sort((a, b) => {
        const x = a[key as "name" | "port"];
        const y = b[key as "name" | "port"];
        return x < y ? -sign : x > y ? sign : 0;
      });
    }
    return matched;
  }

  $: matched = fetchPage($table.search, $table.sortKey, $table.sortDirection);
  $: rows = matched.slice(
    ($table.page - 1) * $table.pageSize,
    $table.page * $table.pageSize,
  );
  $: request = tableStateToSearchParams($table).toString();
</script>

<div data-testid="table-state">
  <DataTable
    title="Fruit"
    {headers}
    {rows}
    sortable
    externalSort
    selectable
    batchSelection
    bind:sortKey={$table.sortKey}
    bind:sortDirection={$table.sortDirection}
    bind:selectedRowIds={$table.selectedRowIds}
  >
    <Toolbar>
      <ToolbarBatchActions>
        <Button>Archive</Button>
      </ToolbarBatchActions>
      <ToolbarContent>
        <ToolbarSearch persistent bind:value={$table.search} />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
  <Pagination
    bind:page={$table.page}
    bind:pageSize={$table.pageSize}
    pageSizes={[5, 10]}
    totalItems={matched.length}
  />
  <p data-testid="request">{request}</p>
</div>
