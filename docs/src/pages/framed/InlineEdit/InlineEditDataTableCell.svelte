<script>
  import { DataTable, InlineEdit } from "carbon-components-svelte";

  let dataTable;

  let rows = [
    { id: "a", item: "Widget", unitPrice: 10, qty: 3 },
    { id: "b", item: "Gadget", unitPrice: 25, qty: 1 },
    { id: "c", item: "Gizmo", unitPrice: 8, qty: 5 },
  ];
</script>

<DataTable
  bind:this={dataTable}
  size="compact"
  headers={[
    { key: "item", value: "Item" },
    { key: "unitPrice", value: "Unit price" },
    { key: "qty", value: "Quantity" },
    {
      key: "total",
      value: "Total",
      display: (_value, row) => `$${row.unitPrice * row.qty}`,
    },
  ]}
  {rows}
>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "item"}
      <InlineEdit
        size="xs"
        id="item-{row.id}"
        labelText="Item name"
        editLabel="Edit item name"
        saveLabel="Save"
        cancelLabel="Cancel"
        bind:value={row.item}
        on:save={() => {
          // Rebuild cells so the Total column stays paired with the right row.
          dataTable.refreshRow(row.id);
        }}
      />
    {:else}
      {cell.display ? cell.display(cell.value, row) : cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
