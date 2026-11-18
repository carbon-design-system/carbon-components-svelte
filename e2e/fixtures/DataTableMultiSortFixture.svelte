<script>
  import {
    DataTable,
    Pagination,
    Toolbar,
    ToolbarContent,
    ToolbarSortBy,
  } from "carbon-components-svelte";

  /** Rows to generate. */
  export let count = 24;

  const headers = [
    { key: "team", value: "Team" },
    { key: "name", value: "Name" },
    { key: "age", value: "Age" },
    { key: "city", value: "City" },
  ];

  const TEAMS = ["Red", "Blue", "Green", "Gold", "Teal"];
  const CITIES = ["Austin", "Berlin", "Cairo", "Delhi", "Essen", "Fiji"];

  // Ties are frequent on purpose: five teams, 60 ages, so a second and third
  // key decide most comparisons.
  const rows = Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    team: TEAMS[i % TEAMS.length],
    name: `Person ${(i * 7919) % 997}`,
    age: 20 + ((i * 37) % 60),
    city: CITIES[(i * 5) % CITIES.length],
  }));

  let sortBy = [];
  let sortKey = null;
  let sortDirection = "none";
  let page = 1;
  let pageSize = 12;
  let selectedRowIds = [];
  let sortEvents = 0;
</script>

<main data-testid="multi-sort">
  <DataTable
    title="People"
    description="Shift+click a header to add a sort"
    sortable
    sortMode="multiple"
    selectable
    {headers}
    {rows}
    {pageSize}
    {page}
    bind:sortBy
    bind:sortKey
    bind:sortDirection
    bind:selectedRowIds
    on:sort={() => (sortEvents += 1)}
  >
    <Toolbar>
      <ToolbarContent>
        <ToolbarSortBy />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
  <Pagination
    bind:page
    bind:pageSize
    totalItems={rows.length}
    pageSizes={[12, 24, 48]}
  />
  <p data-testid="sort-state">{JSON.stringify(sortBy)}</p>
  <p data-testid="sort-events">{sortEvents}</p>
  <p data-testid="selected">{selectedRowIds.length}</p>
</main>
