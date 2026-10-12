<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  export let rows: { id: number; name: string; region: string }[] = [];
  export let emptyText = "";
  export let expandable = false;
  export let selectable = false;
  export let batchSelection = false;
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
  {emptyText}
  {expandable}
  {selectable}
  {batchSelection}
  headers={[
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
  ]}
  {rows}
/>
