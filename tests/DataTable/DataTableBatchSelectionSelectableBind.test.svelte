<svelte:options accessors />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  export let selectable = false;
  export let batchSelection = false;

  const headers = [{ key: "name", value: "Name" }] as const;

  const rows = [
    { id: "a", name: "Load Balancer 1" },
    { id: "b", name: "Load Balancer 2" },
  ];
</script>

<DataTable {headers} {rows} bind:selectable {batchSelection} />
