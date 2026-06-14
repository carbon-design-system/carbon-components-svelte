<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  type Row = { id: string; name: string };

  export let editingRowId: string | null = null;
  export let saved: string[] = [];
  export let discarded: string[] = [];

  export let rows: Row[] = [
    { id: "a", name: "alpha" },
    { id: "b", name: "beta" },
  ];

  const headers = [
    { key: "name", value: "Name" },
    { key: "actions", value: "", empty: true },
  ];
</script>

<DataTable
  {headers}
  {rows}
  bind:editingRowId
  on:save={(event) => (saved = [...saved, event.detail.row.name])}
  on:discard={(event) => (discarded = [...discarded, event.detail.row.name])}
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
        <button type="button" data-testid="save-{row.id}" on:click={save}>
          Save
        </button>
        <button type="button" data-testid="cancel-{row.id}" on:click={cancel}>
          Cancel
        </button>
      {:else}
        <button type="button" data-testid="edit-{row.id}" on:click={edit}>
          Edit
        </button>
      {/if}
    {:else if editing}
      <TextInput size="sm" hideLabel labelText="Name" bind:value={row.name} />
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
</DataTable>

<button
  type="button"
  data-testid="program-edit-b"
  on:click={() => (editingRowId = "b")}
>
  Edit b programmatically
</button>

<div data-testid="editing">{editingRowId ?? ""}</div>
<div data-testid="saved">{saved.join(",")}</div>
<div data-testid="discarded">{discarded.join(",")}</div>
