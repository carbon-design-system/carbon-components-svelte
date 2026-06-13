<script>
  import {
    DataTable,
    EditableCell,
    TextInput,
    NumberInput,
    Button,
  } from "carbon-components-svelte";

  let dataTable;
  let dirty = false;
  let valid = true;

  let rows = [
    { id: "a", item: "Widget", qty: 3, unitPrice: 10 },
    { id: "b", item: "Gadget", qty: 1, unitPrice: 25 },
  ];

  const required = (value) =>
    value && `${value}`.trim() ? undefined : "Required";
  const positive = (value) => (value > 0 ? undefined : "Must be greater than 0");
</script>

<DataTable
  bind:this={dataTable}
  {rows}
  bind:dirty
  bind:valid
  headers={[
    { key: "item", value: "Item" },
    { key: "qty", value: "Quantity" },
    {
      key: "total",
      value: "Total",
      display: (_value, row) => `$${row.qty * row.unitPrice}`,
    },
  ]}
>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "item"}
      <EditableCell {row} {cell} validate={required} let:invalid let:invalidText>
        <TextInput
          size="sm"
          hideLabel
          labelText="Item"
          bind:value={row.item}
          {invalid}
          {invalidText}
        />
      </EditableCell>
    {:else if cell.key === "qty"}
      <EditableCell {row} {cell} validate={positive} let:invalid let:invalidText>
        <NumberInput
          size="sm"
          hideLabel
          label="Quantity"
          bind:value={row.qty}
          {invalid}
          {invalidText}
        />
      </EditableCell>
    {:else}
      {cell.display ? cell.display(cell.value, row) : cell.value}
    {/if}
  </svelte:fragment>
</DataTable>

<Button
  style="margin-top: var(--cds-spacing-05)"
  disabled={!dirty || !valid}
  on:click={() => {
    // Persist `rows`, then mark the current values as pristine.
    dataTable.resetDirty();
  }}
>
  Save changes
</Button>
