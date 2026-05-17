<script lang="ts">
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  export let value: number | string = "";
</script>

<DataTable
  headers={[{ key: "name", value: "Name" }]}
  rows={[{ id: 1, name: "Row 1" }]}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch {value} />
    </ToolbarContent>
  </Toolbar>
</DataTable>
