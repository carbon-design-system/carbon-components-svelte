<script>
  import {
    DataTable,
    EditableCell,
    NumberInput,
    TextInput,
  } from "carbon-components-svelte";

  // BASELINE (hand-rolled, EXPLORATORY). Editing inside a virtualized table.
  // Virtualization recycles DOM: rows scrolled out of view are unmounted and
  // their EditableCells destroyed. Bound values survive (they live on the row
  // objects), but try this to see the rough edges:
  //   - focus is lost when the focused row scrolls out of the viewport
  //   - row height is fixed (itemHeight), so taller inputs can clip
  //   - an open Select/menu inside a cell is destroyed mid-interaction
  // This is the case the proposal flags as ambiguous; the goal of recording
  // it is to decide whether to support it or document it as unsupported.

  const headers = [
    { key: "name", value: "Name" },
    { key: "qty", value: "Quantity" },
    {
      key: "total",
      value: "Total",
      display: (_value, row) => `$${row.qty * 10}`,
    },
  ];

  let rows = Array.from({ length: 500 }, (_, index) => ({
    id: `row-${index}`,
    name: `Item ${index}`,
    qty: (index % 9) + 1,
  }));

  let dirty = false;
  let valid = true;
</script>

<DataTable
  bind:dirty
  bind:valid
  {headers}
  {rows}
  virtualize
  stickyHeader
  size="short"
>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "name"}
      <EditableCell {row} {cell}>
        <TextInput size="sm" hideLabel labelText="Name" bind:value={row.name} />
      </EditableCell>
    {:else if cell.key === "qty"}
      <EditableCell {row} {cell}>
        <NumberInput
          size="sm"
          hideLabel
          label="Quantity"
          min={0}
          bind:value={row.qty}
        />
      </EditableCell>
    {:else}
      {cell.display ? cell.display(cell.value, row) : cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
