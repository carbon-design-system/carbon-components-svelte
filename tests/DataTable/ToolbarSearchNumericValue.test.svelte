<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

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
