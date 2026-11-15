<svelte:options runes />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  // `$state.raw`: edited in place, so Svelte never sees the new rows.
  const rows = $state.raw([
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
  Replace rows silently
</button>

<DataTable sortable headers={[{ key: "name", value: "Name" }]} {rows} />
