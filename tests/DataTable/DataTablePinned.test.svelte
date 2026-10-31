<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  type Row = { id: string; [key: string]: string };

  type DataTableHeader = {
    key: string;
    value: string;
    width?: string;
    columnPinned?: "start" | "end";
  };

  export let headers: readonly DataTableHeader[] = [
    { key: "name", value: "Name", columnPinned: "start", width: "8rem" },
    { key: "region", value: "Region", width: "10rem" },
    { key: "owner", value: "Owner", columnPinned: "end", width: "4rem" },
  ];

  export let rows: readonly Row[] = [
    { id: "a", name: "Load Balancer 3", region: "us-east", owner: "ops" },
    { id: "b", name: "Load Balancer 1", region: "eu-de", owner: "web" },
  ];

  export let expandable = false;
  export let batchSelection = false;
  export let selectable = false;
  export let withFooter = false;
</script>

{#if withFooter}
  <DataTable {headers} {rows} {expandable} {batchSelection} {selectable}>
    <svelte:fragment slot="footerCell" let:header>
      {header.key}
    </svelte:fragment>
  </DataTable>
{:else}
  <DataTable {headers} {rows} {expandable} {batchSelection} {selectable} />
{/if}
