<script>
  import { DataTable } from "carbon-components-svelte";

  let selectedRowIds = ["a", "c"];
  let expandedRowIds = ["b"];
</script>

<DataTable
  selectable
  expandable
  bind:selectedRowIds
  bind:expandedRowIds
  headers={[
    { key: "name", value: "Name" },
    { key: "status", value: "Status" },
    { key: "port", value: "Port" },
  ]}
  rows={[
    {
      id: "a",
      name: "Load Balancer 1",
      status: "Active",
      port: 3000,
    },
    {
      id: "b",
      name: "Load Balancer 2",
      status: "Active",
      port: 443,
    },
    {
      id: "c",
      name: "Load Balancer 3",
      status: "Inactive",
      port: 80,
    },
  ]}
>
  <svelte:fragment slot="cell" let:row let:cell let:rowSelected let:rowExpanded>
    {#if cell.key === "status"}
      <span
        style="color: {rowSelected
          ? '#0f62fe'
          : cell.value === 'Active'
            ? 'green'
            : 'gray'}"
      >
        {cell.value}
        {rowExpanded ? "(expanded)" : ""}
      </span>
    {:else}
      {cell.value}
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="expanded-row" let:row let:rowSelected>
    <div>
      Additional details for <strong>{row.name}</strong>
      {rowSelected ? "(Currently selected)" : ""}
    </div>
  </svelte:fragment>
</DataTable>
