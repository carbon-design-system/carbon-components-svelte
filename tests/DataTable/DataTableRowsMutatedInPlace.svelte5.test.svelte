<svelte:options runes />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  const rows = $state([
    { id: "a", name: "Alpha" },
    { id: "b", name: "Bravo" },
  ]);
</script>

<button
  type="button"
  onclick={() =>
    rows.splice(
      0,
      rows.length,
      { id: "d", name: "Delta" },
      { id: "c", name: "Charlie" },
    )}
>
  Replace rows
</button>
<button type="button" onclick={() => (rows[0].name = "Echo")}>
  Rename first row
</button>

<DataTable sortable headers={[{ key: "name", value: "Name" }]} {rows} />
