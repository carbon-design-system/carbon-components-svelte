<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import EditableCell from "carbon-components-svelte/DataTable/EditableCell.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  type Row = { id: string; name: string; qty: number };

  let table: DataTable;

  export let dirty = false;
  export let valid = true;

  export let rows: Row[] = [{ id: "a", name: "alpha", qty: 2 }];

  export function resetDirty() {
    table.resetDirty();
  }

  // `total` reads `qty` via display(); it goes stale on an in-place edit
  // unless the cell is re-derived. EditableCell does that automatically.
  const headers: ComponentProps<DataTable>["headers"] = [
    { key: "name", value: "Name" },
    { key: "qty", value: "Qty" },
    {
      key: "total",
      value: "Total",
      display: (_value, row) => (row as Row).qty * 10,
    },
  ];

  const required = (value: string) => (value ? undefined : "Required");
</script>

<DataTable bind:this={table} {headers} {rows} bind:dirty bind:valid>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "name"}
      <EditableCell
        {row}
        {cell}
        validate={required}
        let:invalid
        let:invalidText
      >
        <!-- Svelte 3 and 4 can't bind to a `let:` variable; write the row instead. -->
        <TextInput
          value={row.name}
          on:input={(event) => (row.name = String(event.detail ?? ""))}
          {invalid}
          {invalidText}
          hideLabel
          labelText="Name"
        />
      </EditableCell>
    {:else if cell.key === "qty"}
      <EditableCell {row} {cell}>
        <NumberInput
          value={row.qty}
          on:input={(event) => (row.qty = event.detail ?? 0)}
          hideLabel
          labelText="Qty"
        />
      </EditableCell>
    {:else}
      {cell.display ? cell.display(cell.value, row) : cell.value}
    {/if}
  </svelte:fragment>
</DataTable>

<div data-testid="dirty">{dirty}</div>
<div data-testid="valid">{valid}</div>
