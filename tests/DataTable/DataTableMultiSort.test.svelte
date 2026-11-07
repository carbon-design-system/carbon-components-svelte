<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSortBy from "carbon-components-svelte/DataTable/ToolbarSortBy.svelte";
  import type { ComponentProps } from "svelte";

  export let sortMode: ComponentProps<DataTable>["sortMode"] = "multiple";
  export let sortBy: ComponentProps<DataTable>["sortBy"] = [];
  export let sortKey: ComponentProps<DataTable>["sortKey"] = null;
  export let sortDirection: ComponentProps<DataTable>["sortDirection"] = "none";
  export let sortAlways = false;
  export let selectable = false;
  export let externalSort = false;
  export let sort: ComponentProps<DataTable>["sort"] = undefined;
  export let toolbar = false;
  export let sortStatusText: ComponentProps<DataTable>["sortStatusText"] =
    undefined;
  export let onsort: ((event: CustomEvent) => void) | undefined = undefined;

  const headers = [
    { key: "team", value: "Team" },
    { key: "name", value: "Name" },
    { key: "age", value: "Age" },
    { key: "note", value: "Note", sort: false as const },
  ];

  const rows = [
    { id: "1", team: "Red", name: "Cy", age: 30, note: "" },
    { id: "2", team: "Blue", name: "Bo", age: 25, note: "" },
    { id: "3", team: "Red", name: "Al", age: 30, note: "" },
    { id: "4", team: "Blue", name: "Di", age: 40, note: "" },
    { id: "5", team: "Red", name: "Ed", age: 25, note: "" },
  ];
</script>

<DataTable
  sortable
  {sortMode}
  bind:sortBy
  bind:sortKey
  bind:sortDirection
  {sortAlways}
  {externalSort}
  {selectable}
  {sort}
  {headers}
  {rows}
  {...sortStatusText ? { sortStatusText } : {}}
  on:sort={(event) => onsort?.(event)}
>
  {#if toolbar}
    <Toolbar>
      <ToolbarContent>
        <ToolbarSortBy />
      </ToolbarContent>
    </Toolbar>
  {/if}
</DataTable>

<div data-testid="state">
  {JSON.stringify({ sortBy, sortKey, sortDirection })}
</div>
