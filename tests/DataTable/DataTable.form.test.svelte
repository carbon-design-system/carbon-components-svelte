<svelte:options accessors />

<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  export let selectedRowIds: number[] = [];
  export let radio = false;
  export let onSelect: () => void = () => {};

  const headers = [{ key: "name", value: "Name" }] as const;
  const rows = [
    { id: 1, name: "Ada" },
    { id: 2, name: "Grace" },
    { id: 3, name: "Linus" },
  ];
</script>

<form data-testid="form">
  <DataTable
    selectable={!radio}
    batchSelection={!radio}
    {radio}
    inputName="user"
    bind:selectedRowIds
    {headers}
    {rows}
    on:click:row--select={onSelect}
    on:click:header--select={onSelect}
  />
</form>
<p data-testid="bound">{JSON.stringify(selectedRowIds)}</p>
