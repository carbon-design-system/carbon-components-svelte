<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let headers: ComponentProps<DataTable>["headers"] = [
    { key: "name", value: "Name" },
  ];
  export let rows: ComponentProps<DataTable>["rows"] = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Bravo" },
  ];
  /** Extra ToolbarSearch props; an omitted key keeps ToolbarSearch's default. */
  export let searchProps: ComponentProps<ToolbarSearch> = {};
  export let value: ComponentProps<ToolbarSearch>["value"] = "";
  export let expanded: ComponentProps<ToolbarSearch>["expanded"] = false;
  export let onsearch: ((value: string | number) => void) | undefined =
    undefined;

  let search: ToolbarSearch;
</script>

<DataTable {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        bind:this={search}
        bind:value
        bind:expanded
        {...searchProps}
        on:search={(e) => onsearch?.(e.detail)}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<div data-testid="value">{value}</div>
<button type="button" data-testid="clear" on:click={() => search.clear()}>
  Clear
</button>
