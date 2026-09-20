<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let rows: ReadonlyArray<{
    id: string;
    name: string;
  }>;
</script>

<DataTable headers={[{ key: "name", value: "Name" }]} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
</DataTable>
