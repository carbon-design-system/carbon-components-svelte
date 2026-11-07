<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  export let rows: Row[] = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
    { id: "c", name: "Gamma" },
  ];

  type Row = { id: string; [key: string]: string };
  type Header = { key: string; value: string };

  const headers: readonly Header[] = [
    { key: "name", value: "Name" },
    { key: "actions", value: "Actions" },
  ];
</script>

<DataTable {headers} {rows}>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "actions"}
      <Button
        size="small"
        on:click={() => (rows = rows.filter((r) => r.id !== row.id))}
      >
        Delete {row.name}
      </Button>
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
<Button on:click={() => (rows = rows.filter((r) => r.id !== "a"))}>
  Remove Alpha
</Button>
