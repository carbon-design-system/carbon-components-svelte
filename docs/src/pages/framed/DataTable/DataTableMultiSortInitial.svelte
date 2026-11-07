<script>
  import { DataTable, Stack } from "carbon-components-svelte";

  const headers = [
    { key: "team", value: "Team" },
    { key: "name", value: "Name" },
    { key: "age", value: "Age" },
  ];

  const rows = [
    { id: "1", team: "Red", name: "Cy", age: 30 },
    { id: "2", team: "Blue", name: "Bo", age: 25 },
    { id: "3", team: "Red", name: "Al", age: 30 },
    { id: "4", team: "Blue", name: "Di", age: 40 },
    { id: "5", team: "Red", name: "Ed", age: 25 },
  ];

  /** @type {import("carbon-components-svelte/DataTable/DataTable.svelte").DataTableSortRule[]} */
  let sortBy = [
    { key: "team", direction: "ascending" },
    { key: "age", direction: "descending" },
  ];
  let sortKey = null;
  let sortDirection = "none";
</script>

<Stack gap={5}>
  <DataTable
    sortable
    sortMode="multiple"
    bind:sortBy
    bind:sortKey
    bind:sortDirection
    {headers}
    {rows}
  />
  <pre>{JSON.stringify({ sortBy, sortKey, sortDirection }, null, 2)}</pre>
</Stack>
