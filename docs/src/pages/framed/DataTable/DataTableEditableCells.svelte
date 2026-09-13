<script>
  import { DataTable, NumberInput } from "carbon-components-svelte";

  let dataTable;

  let rows = [
    { id: "a", item: "Enterprise seat", unitPrice: 89, qty: 12 },
    { id: "b", item: "Standard seat", unitPrice: 29, qty: 40 },
    { id: "c", item: "API overage (per 1K calls)", unitPrice: 2, qty: 150 },
  ];
</script>

<DataTable
  bind:this={dataTable}
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
    {#if cell.key === "qty"}
      <NumberInput
        size="sm"
        hideLabel
        label="Quantity"
        min={0}
        bind:value={row.qty}
        on:input={() => {
          // Rebuild cells so the Total column picks up the new qty.
          dataTable.refreshRow(row.id);
        }}
      />
    {:else}
      {cell.display ? cell.display(cell.value, row) : cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
