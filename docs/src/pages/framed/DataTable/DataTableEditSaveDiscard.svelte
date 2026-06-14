<script>
  import {
    Button,
    DataTable,
    EditableCell,
    NumberInput,
    Select,
    SelectItem,
    TextInput,
    Toolbar,
    ToolbarContent,
  } from "carbon-components-svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  // BASELINE (hand-rolled). Demonstrates a full edit -> save | discard flow
  // built only with today's primitives (EditableCell + bind:dirty/valid +
  // resetDirty). Highlights what is still manual: the snapshot, the discard
  // restore, and the rows reassignment needed to push restored values back
  // into the bound inputs.

  const protocols = ["HTTP", "HTTPS", "TCP", "UDP"];

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
  ];

  const seed = [
    { id: "a", name: "Rule 1", protocol: "HTTP", port: 80 },
    { id: "b", name: "Rule 2", protocol: "HTTPS", port: 443 },
    { id: "c", name: "Rule 3", protocol: "TCP", port: 3000 },
  ];

  let dataTable;
  let dirty = false;
  let valid = true;

  // Manual deep snapshot of the last-saved state, used to discard edits.
  const clone = (list) => list.map((row) => ({ ...row }));
  let rows = clone(seed);
  let saved = clone(seed);

  const portRange = (value) =>
    value >= 1 && value <= 65535 ? undefined : "Port must be 1-65535";
  const required = (value) =>
    value && `${value}`.trim() ? undefined : "Required";

  function save() {
    // Persist to your backend here, then mark the new baseline.
    saved = clone(rows);
    dataTable.resetDirty();
  }

  function discard() {
    // Restoring in place would NOT update the bound inputs (Svelte does not
    // track row.field deeply), so we must rebuild rows with fresh objects to
    // force the inputs to rebind. This is the boilerplate `editable` should remove.
    rows = clone(saved);
    dataTable.resetDirty();
  }
</script>

<DataTable bind:this={dataTable} bind:dirty bind:valid {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <Button kind="secondary" icon={Undo} disabled={!dirty} on:click={discard}>
        Discard
      </Button>
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
    {:else if cell.key === "protocol"}
      <EditableCell {row} {cell}>
        <Select
          size="sm"
          hideLabel
          labelText="Protocol"
          bind:selected={row.protocol}
        >
          {#each protocols as protocol}
            <SelectItem value={protocol} text={protocol} />
          {/each}
        </Select>
      </EditableCell>
    {:else if cell.key === "port"}
      <EditableCell
        {row}
        {cell}
        validate={portRange}
        let:invalid
        let:invalidText
      >
        <NumberInput
          size="sm"
          hideLabel
          label="Port"
          bind:value={row.port}
          {invalid}
          {invalidText}
        />
      </EditableCell>
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
