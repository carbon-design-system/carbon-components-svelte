<script lang="ts">
  import {
    Button,
    DataTable,
    Pagination,
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

  // Orders by code point, so uppercase names sort before lowercase ones. A
  // client side `Intl.Collator` sort would put "apple" first.
  function fetchPage(
    key: string | null,
    direction: string,
    query: string,
    page: number,
    pageSize: number,
  ) {
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
    return {
      total: matched.length,
      rows: matched.slice((page - 1) * pageSize, page * pageSize),
    };
  }

  let sortKey: string | null = null;
  let sortDirection: "none" | "ascending" | "descending" = "none";
  let query = "";
  let page = 1;
  let pageSize = 5;
  let selectedRowIds: string[] = [];

  $: response = fetchPage(sortKey, sortDirection, query, page, pageSize);
</script>

<div data-testid="external-sort">
  <DataTable
    title="Fruit"
    {headers}
    rows={response.rows}
    sortable
    externalSort
    selectable
    batchSelection
    bind:sortKey
    bind:sortDirection
    bind:selectedRowIds
    on:sort={() => (page = 1)}
  >
    <Toolbar>
      <ToolbarBatchActions>
        <Button>Archive</Button>
      </ToolbarBatchActions>
      <ToolbarContent>
        <ToolbarSearch persistent bind:value={query} />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
  <Pagination bind:page bind:pageSize totalItems={response.total} />
</div>
