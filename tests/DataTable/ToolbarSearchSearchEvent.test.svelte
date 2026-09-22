<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let onSearch: (value: string | number) => void = () => {};

  const rows = [
    { id: 1, name: "Balancer 1" },
    { id: 2, name: "Balancer 2" },
  ];
</script>

<DataTable headers={[{ key: "name", value: "Name" }]} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        persistent
        on:search={(event) => {
          onSearch(event.detail);
        }}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>
