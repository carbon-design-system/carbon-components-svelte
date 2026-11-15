<svelte:options runes />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  let { selectable = false } = $props();

  const rows = $state([
    { id: "a", name: "Alpha" },
    { id: "b", name: "Bravo" },
    { id: "c", name: "Charlie" },
  ]);
</script>

<button type="button" onclick={() => rows.splice(1, 1)}>Remove Bravo</button>

<DataTable {selectable} headers={[{ key: "name", value: "Name" }]} {rows} />
