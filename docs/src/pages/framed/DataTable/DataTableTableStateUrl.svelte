<script>
  import {
    createTableState,
    DataTable,
    Pagination,
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

  // Reading the URL and storage waits for the first subscriber in the
  // browser, so this is safe to create during server rendering.
  const table = createTableState(
    { pageSize: 5 },
    {
      url: { prefix: "lb_" },
      persist: { key: "load-balancers", pick: ["pageSize"] },
      pageSizes: [5, 10],
      sortKeys: headers.map((header) => header.key),
    },
  );

  $: matched = database
    .filter((row) =>
      row.name.toLowerCase().includes($table.search.toLowerCase()),
    )
    .sort((a, b) => {
      const { sortKey, sortDirection } = $table;
      if (!sortKey || sortDirection === "none") return 0;
      const sign = sortDirection === "ascending" ? 1 : -1;
      return a[sortKey] === b[sortKey]
        ? 0
        : a[sortKey] < b[sortKey]
          ? -sign
          : sign;
    });
  $: rows = matched.slice(
    ($table.page - 1) * $table.pageSize,
    $table.page * $table.pageSize,
  );
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
  totalItems={matched.length}
/>
