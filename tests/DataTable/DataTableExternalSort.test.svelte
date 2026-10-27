<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
  import type { ComponentProps } from "svelte";

  type Row = { id: string; [key: string]: string | number };

  export let rows: Row[] = [
    { id: "a", name: "Banana", port: 3 },
    { id: "b", name: "apple", port: 1 },
    { id: "c", name: "Cherry", port: 2 },
  ];
  export let externalSort = true;
  export let sortKey: ComponentProps<DataTable>["sortKey"] = null;
  export let sortDirection: ComponentProps<DataTable>["sortDirection"] = "none";
  export let selectable = false;
  export let batchSelection = false;
  export let pageSize = 0;
  export let search = false;
  export let sortSpy: (a: unknown, b: unknown) => number = () => 0;
  export let headerSortSpy: (a: unknown, b: unknown) => number = () => 0;
  export let onsort: ((event: CustomEvent) => void) | undefined = undefined;

  let headers: ComponentProps<DataTable>["headers"] = [];
  $: headers = [
    { key: "name", value: "Name", sort: headerSortSpy },
    { key: "port", value: "Port" },
  ];
</script>

<DataTable
  {headers}
  {rows}
  sortable
  {externalSort}
  sort={sortSpy}
  {selectable}
  {batchSelection}
  {pageSize}
  page={1}
  bind:sortKey
  bind:sortDirection
  on:sort={(event) => onsort?.(event)}
>
  {#if search}
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows />
      </ToolbarContent>
    </Toolbar>
  {/if}
</DataTable>
