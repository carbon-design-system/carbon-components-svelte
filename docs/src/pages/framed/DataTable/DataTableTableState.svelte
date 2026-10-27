<script>
  import {
    createTableState,
    DataTable,
    Pagination,
    tableStateToSearchParams,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ];

  const database = Array.from({ length: 23 }).map((_, i) => ({
    id: String(i),
    name: `Load Balancer ${i + 1}`,
    port: 3000 + i * 7,
  }));

  // Create the store in the component, never at module scope.
  const table = createTableState({ pageSize: 5 });

  // Simulate a server that sorts, filters and pages.
  function fetchPage({ sortKey, sortDirection, search, page, pageSize }) {
    let matched = database.filter((row) =>
      row.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (sortKey && sortDirection !== "none") {
      const sign = sortDirection === "ascending" ? 1 : -1;
      matched = [...matched].sort((a, b) =>
        a[sortKey] === b[sortKey] ? 0 : a[sortKey] < b[sortKey] ? -sign : sign,
      );
    }
    return {
      total: matched.length,
      rows: matched.slice((page - 1) * pageSize, page * pageSize),
    };
  }

  // Read $table once, so one click makes one request.
  $: request = tableStateToSearchParams($table).toString();
  $: ({ rows, total } = fetchPage($table));
</script>

<DataTable
  sortable
  externalSort
  {headers}
  {rows}
  bind:sortKey={$table.sortKey}
  bind:sortDirection={$table.sortDirection}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent bind:value={$table.search} />
    </ToolbarContent>
  </Toolbar>
</DataTable>
<Pagination
  bind:page={$table.page}
  bind:pageSize={$table.pageSize}
  pageSizes={[5, 10]}
  totalItems={total}
/>
<code>GET /api/load-balancers?{request}</code>
