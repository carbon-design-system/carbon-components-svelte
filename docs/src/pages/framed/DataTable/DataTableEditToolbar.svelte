<script>
  import {
    Button,
    DataTable,
    EditableCell,
    NumberInput,
    TextInput,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  // BASELINE (hand-rolled). Bulk entry with a toolbar: add a blank row, remove
  // selected rows, save. The toolbar wiring is all manual: id generation, the
  // rows array reassignment for add/remove, and clearing the selection. An
  // `edit-toolbar` slot with `let:addRow` / `let:removeRow` should remove this.

  const headers = [
    { key: "name", value: "Name" },
    { key: "qty", value: "Quantity" },
  ];

  let rows = [
    { id: "a", name: "Widget", qty: 3 },
    { id: "b", name: "Gadget", qty: 1 },
  ];

  let dataTable;
  let dirty = false;
  let valid = true;
  let selectedRowIds = [];

  let nextId = rows.length;
  const required = (value) =>
    value && `${value}`.trim() ? undefined : "Required";

  function addRow() {
    // Manual id bookkeeping + array reassignment.
    const id = `row-${nextId++}`;
    rows = [...rows, { id, name: "", qty: 1 }];
  }

  function removeSelected() {
    const remove = new Set(selectedRowIds);
    rows = rows.filter((row) => !remove.has(row.id));
    selectedRowIds = [];
  }

  function save() {
    // Persist rows here.
    dataTable.resetDirty();
  }
</script>

<DataTable
  bind:this={dataTable}
  bind:dirty
  bind:valid
  bind:selectedRowIds
  batchSelection
  {headers}
  {rows}
>
  <Toolbar>
    <ToolbarBatchActions>
      <Button icon={TrashCan} on:click={removeSelected}>Delete</Button>
    </ToolbarBatchActions>
    <ToolbarContent>
      <Button kind="ghost" icon={Add} on:click={addRow}>Add row</Button>
      <Button icon={Save} disabled={!dirty || !valid} on:click={save}>
        Save changes
      </Button>
    </ToolbarContent>
  </Toolbar>

  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "name"}
      <EditableCell
        {row}
        {cell}
        validate={required}
        let:invalid
        let:invalidText
      >
        <TextInput
          size="sm"
          hideLabel
          labelText="Name"
          bind:value={row.name}
          {invalid}
          {invalidText}
        />
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
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
