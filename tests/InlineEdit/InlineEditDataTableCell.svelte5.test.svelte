<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import InlineEdit from "carbon-components-svelte/InlineEdit/InlineEdit.svelte";

  type Row = { id: string; item: string; qty: number };

  let dataTable: DataTable<Row>;

  let rows: Row[] = [
    { id: "a", item: "Widget", qty: 3 },
    { id: "b", item: "Gadget", qty: 1 },
  ];
</script>

<button
  type="button"
  on:click={() => {
    rows = rows.map((row) =>
      row.id === "a" ? { ...row, item: "Sprocket" } : row,
    );
  }}
>
  Rename outside
</button>

<DataTable
  bind:this={dataTable}
  size="compact"
  headers={[
    { key: "item", value: "Item" },
    { key: "qty", value: "Quantity" },
  ]}
  {rows}
>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "item"}
      <InlineEdit
        size="xs"
        id="item-{row.id}"
        labelText="Item {row.id}"
        editLabel="Edit {row.id}"
        saveLabel="Save {row.id}"
        cancelLabel="Cancel {row.id}"
        bind:value={row.item}
        on:save={() => {
          console.log("save", row.id, row.item);
          dataTable.refreshRow(row.id);
        }}
        on:cancel={() => console.log("cancel", row.id, row.item)}
      />
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
