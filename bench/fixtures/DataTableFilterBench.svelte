<svelte:options accessors />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let rows = [];
  export let filterMode = "remove";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];
</script>

<DataTable size="short" {headers} {rows} {filterMode}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
</DataTable>
