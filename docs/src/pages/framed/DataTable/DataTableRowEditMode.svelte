<script>
  import {
    Button,
    DataTable,
    NumberInput,
    TextInput,
  } from "carbon-components-svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  // BASELINE (hand-rolled). Row-level edit mode: one row enters edit at a
  // time with Save/Cancel, all other rows stay read-only. Everything here is
  // manual state that `editable="row"` should own: which row is editing, the
  // per-row snapshot for cancel, swapping value vs input, and (missing here)
  // Enter-to-commit / Esc-to-cancel and focus management.

  const headers = [
    { key: "name", value: "Name" },
    { key: "qty", value: "Quantity" },
    { key: "actions", value: "", empty: true },
  ];

  let rows = [
    { id: "a", name: "Widget", qty: 3 },
    { id: "b", name: "Gadget", qty: 1 },
    { id: "c", name: "Gizmo", qty: 5 },
  ];

  let editingId = null;
  let snapshot = null;

  function startEdit(row) {
    editingId = row.id;
    snapshot = { ...row };
  }

  function saveEdit() {
    // Persist row here. Reassign rows so the now-static cells re-derive and
    // reflect the in-place edits (another manual step `editable="row"` removes).
    rows = [...rows];
    editingId = null;
    snapshot = null;
  }

  function cancelEdit() {
    // Restore the snapshot. New object references force the inputs to rebind.
    rows = rows.map((row) => (row.id === editingId ? { ...snapshot } : row));
    editingId = null;
    snapshot = null;
  }
</script>

<DataTable {headers} {rows}>
  <svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "actions"}
      {#if editingId === row.id}
        <Button
          kind="ghost"
          size="small"
          iconDescription="Save"
          icon={Checkmark}
          on:click={saveEdit}
        />
        <Button
          kind="ghost"
          size="small"
          iconDescription="Cancel"
          icon={Close}
          on:click={cancelEdit}
        />
      {:else}
        <Button
          kind="ghost"
          size="small"
          iconDescription="Edit row"
          icon={Edit}
          disabled={editingId !== null && editingId !== row.id}
          on:click={() => startEdit(row)}
        />
      {/if}
    {:else if editingId === row.id && cell.key === "name"}
      <TextInput size="sm" hideLabel labelText="Name" bind:value={row.name} />
    {:else if editingId === row.id && cell.key === "qty"}
      <NumberInput size="sm" hideLabel label="Quantity" bind:value={row.qty} />
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>
