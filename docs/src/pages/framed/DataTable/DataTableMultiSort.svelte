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
    { key: "city", value: "City" },
  ];

  const rows = [
    { id: "1", team: "Red", name: "Cy", age: 30, city: "Austin" },
    { id: "2", team: "Blue", name: "Bo", age: 25, city: "Berlin" },
    { id: "3", team: "Red", name: "Al", age: 30, city: "Cairo" },
    { id: "4", team: "Blue", name: "Di", age: 40, city: "Delhi" },
    { id: "5", team: "Red", name: "Ed", age: 25, city: "Essen" },
    { id: "6", team: "Blue", name: "Fay", age: 25, city: "Fiji" },
  ];
</script>

<DataTable
  title="People"
  description="Shift+click a header to add it to the sort."
  sortable
  sortMode="multiple"
  {headers}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSortBy />
    </ToolbarContent>
  </Toolbar>
</DataTable>
