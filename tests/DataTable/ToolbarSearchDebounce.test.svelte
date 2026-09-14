<svelte:options accessors />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import type { ComponentProps } from "svelte";
  import FilterRowsSpy from "./FilterRowsSpy.svelte";

  export let debounce: ComponentProps<ToolbarSearch>["debounce"] = 0;
  export let value: ComponentProps<ToolbarSearch>["value"] = "";
  export let filteredRowIds: ComponentProps<ToolbarSearch>["filteredRowIds"] =
    [];
  export let filterRowsCount = 0;

  const rows = Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    name: `Balancer ${i + 1}`,
  }));
</script>

<DataTable headers={[{ key: "name", value: "Name" }]} {rows}>
  <Toolbar>
    <ToolbarContent>
      <FilterRowsSpy bind:count={filterRowsCount}>
        <ToolbarSearch
          shouldFilterRows
          persistent
          {debounce}
          bind:value
          bind:filteredRowIds
        />
      </FilterRowsSpy>
    </ToolbarContent>
  </Toolbar>
</DataTable>
