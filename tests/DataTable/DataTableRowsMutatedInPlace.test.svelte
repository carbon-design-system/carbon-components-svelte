<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  let rows = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Bravo" },
  ];
</script>

<button
  type="button"
  on:click={() => {
    rows.splice(
      0,
      rows.length,
      { id: "d", name: "Delta" },
      { id: "c", name: "Charlie" },
    );
    rows = rows;
  }}
>
  Replace rows
</button>
<button type="button" on:click={() => (rows[0].name = "Echo")}>
  Rename first row
</button>

<DataTable sortable headers={[{ key: "name", value: "Name" }]} {rows} />
