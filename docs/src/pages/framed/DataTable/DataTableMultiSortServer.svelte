<script>
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSortBy,
  } from "carbon-components-svelte";

  const headers = [
    { key: "team", value: "Team" },
    { key: "name", value: "Name" },
    { key: "age", value: "Age" },
  ];

  // Mock data from the server.
  const fromServer = [
    { id: "1", team: "Red", name: "Cy", age: 30 },
    { id: "2", team: "Blue", name: "Bo", age: 25 },
    { id: "3", team: "Red", name: "Al", age: 30 },
    { id: "4", team: "Blue", name: "Di", age: 40 },
    { id: "5", team: "Red", name: "Ed", age: 25 },
  ];

  let rows = [...fromServer];
  /** @type {ReadonlyArray<import("carbon-components-svelte/DataTable/DataTable.svelte").DataTableSortRule>} */
  let sortBy = [];

  // Simulate a request that sorts by every key in order.
  /** @param {ReadonlyArray<{ key: string; direction: string }>} list */
  function fakeServerSort(list) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          [...fromServer].sort((a, b) => {
            for (const { key, direction } of list) {
              if (a[key] === b[key]) continue;
              const result = a[key] < b[key] ? -1 : 1;
              return direction === "ascending" ? result : -result;
            }
            return 0;
          }),
        );
      }, 250);
    });
  }
</script>

<DataTable
  sortable
  sortMode="multiple"
  bind:sortBy
  {headers}
  {rows}
  on:sort={async (event) => {
    // Hold the table where it is until the server answers.
    event.preventDefault();
    const next = event.detail.sortBy;
    rows = await fakeServerSort(next);
    sortBy = next;
  }}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSortBy />
    </ToolbarContent>
  </Toolbar>
</DataTable>
