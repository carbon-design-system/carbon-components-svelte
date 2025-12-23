<script lang="ts">
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
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

