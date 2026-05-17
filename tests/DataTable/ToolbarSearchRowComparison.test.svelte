<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let rows: ComponentProps<DataTable>["rows"] = [];
  export let shouldFilterRows: ComponentProps<ToolbarSearch>["shouldFilterRows"] = true;

  let updateCount = 0;
  let filteredRowIds: (string | number)[] = [];
  let previousFilteredIds: (string | number)[] = [];

  $: {
    if (
      JSON.stringify(filteredRowIds) !== JSON.stringify(previousFilteredIds)
    ) {
      updateCount++;
      previousFilteredIds = [...filteredRowIds];
    }
  }
</script>

<div data-testid="filtered-ids">{JSON.stringify(filteredRowIds)}</div>
<div data-testid="update-count">{updateCount}</div>

<DataTable
  headers={[
    { key: "id", value: "ID" },
    { key: "name", value: "Name" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch {shouldFilterRows} bind:filteredRowIds />
    </ToolbarContent>
  </Toolbar>
</DataTable>
