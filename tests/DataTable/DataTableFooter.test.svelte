<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import type { ComponentProps } from "svelte";

  type Row = {
    id: string;
    name: string;
    protocol: string;
    port: number;
  };

  export let headers: readonly {
    key: keyof Omit<Row, "id">;
    value: string;
  }[] = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
  ];

  export let rows: readonly Row[] = [
    { id: "a", name: "Load Balancer 3", protocol: "HTTP", port: 3000 },
    { id: "b", name: "Load Balancer 1", protocol: "HTTP", port: 443 },
    { id: "c", name: "Load Balancer 2", protocol: "HTTP", port: 80 },
  ];

  export let expandable = false;
  export let selectable = false;
  export let pageSize = 0;
  export let page = 0;
  export let virtualize: ComponentProps<DataTable>["virtualize"] = undefined;
  export let withFooter = true;

  $: totalPort = rows.reduce((total, row) => total + row.port, 0);
</script>

{#if withFooter}
  <DataTable
    {headers}
    {rows}
    {expandable}
    {selectable}
    {pageSize}
    {page}
    {virtualize}
  >
    <svelte:fragment slot="footerCell" let:header let:index>
      {#if header.key === "port"}
        {totalPort}
      {:else if index === 0}
        Total
      {/if}
    </svelte:fragment>
  </DataTable>
{:else}
  <DataTable
    {headers}
    {rows}
    {expandable}
    {selectable}
    {pageSize}
    {page}
    {virtualize}
  />
{/if}
