<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

  export let rows: { id: number; name: string; region: string }[] = [];
</script>

<button
  type="button"
  on:click={() => {
    rows = [{ id: 1, name: "api-gateway", region: "us-east-1" }];
  }}
>
  Add rows
</button>

<DataTable
  {...$$restProps}
  headers={[
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch persistent shouldFilterRows />
    </ToolbarContent>
  </Toolbar>
</DataTable>
