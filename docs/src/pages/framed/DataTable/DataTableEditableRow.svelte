<script>
  import {
    Button,
    DataTable,
    EditableCell,
    NumberInput,
    TextInput,
  } from "carbon-components-svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  let editingRowId = null;
  let valid = true;

  let rows = [
    { id: "a", name: "Widget", qty: 3 },
    { id: "b", name: "Gadget", qty: 1 },
    { id: "c", name: "Gizmo", qty: 5 },
  ];

  const required = (value) =>
    value && `${value}`.trim() ? undefined : "Required";
</script>

<DataTable
  bind:editingRowId
  bind:valid
  headers={[
    { key: "name", value: "Name" },
    { key: "qty", value: "Quantity" },
    {
      key: "total",
      value: "Total",
      display: (_value, row) => `$${row.qty * 10}`,
    },
    { key: "actions", empty: true },
  ]}
  {rows}
  on:save={(e) => console.log("save", e.detail.row)}
  on:discard={(e) => console.log("discard", e.detail.row)}
>
  <svelte:fragment
    slot="cell"
    let:row
    let:cell
    let:editing
    let:edit
    let:save
    let:cancel
  >
    {#if cell.key === "actions"}
      {#if editing}
        <Button
          size="small"
          kind="ghost"
          icon={Checkmark}
          iconDescription="Save"
          disabled={!valid}
          on:click={save}
        />
        <Button
          size="small"
          kind="ghost"
          icon={Close}
          iconDescription="Cancel"
          on:click={cancel}
        />
      {:else}
        <Button
          size="small"
          kind="ghost"
          icon={Edit}
          iconDescription="Edit row"
          disabled={editingRowId !== null}
          on:click={edit}
        />
      {/if}
    {:else if editing && cell.key === "name"}
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
    {:else if editing && cell.key === "qty"}
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
