<script>
  import {
    Button,
    DataTable,
    NumberInput,
    Stack,
  } from "carbon-components-svelte";

  let dataTable;

  let rows = [
    { id: "a", item: "Enterprise seat", unitPrice: 89, qty: 12 },
    { id: "b", item: "Standard seat", unitPrice: 29, qty: 40 },
    { id: "c", item: "API overage (per 1K calls)", unitPrice: 2, qty: 150 },
  ];

  function snapshotQty() {
    return Object.fromEntries(rows.map((row) => [row.id, row.qty]));
  }

  let savedQtyById = snapshotQty();
  let hasEdits = false;

  function syncHasEdits() {
    hasEdits = rows.some((row) => row.qty !== savedQtyById[row.id]);
  }

  function updateTotals() {
    dataTable.refreshCells();
    savedQtyById = snapshotQty();
    hasEdits = false;
  }
</script>

<Stack gap={5}>
  <Button
    kind="secondary"
    size="sm"
    disabled={!hasEdits}
    on:click={updateTotals}
  >
    Update totals
  </Button>

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
          on:input={syncHasEdits}
        />
      {:else}
        {cell.display ? cell.display(cell.value, row) : cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</Stack>
