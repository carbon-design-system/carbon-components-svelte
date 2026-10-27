<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  type Row = { id: string; [key: string]: string };

  type DataTableHeader = {
    key: string;
    value: string;
    width?: string;
    minWidth?: string;
    maxWidth?: string | number;
    columnResizable?: boolean;
  };

  export let headers: readonly DataTableHeader[] = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region", minWidth: "96px", maxWidth: 200 },
    { key: "owner", value: "Owner", columnResizable: false },
  ];

  export let rows: readonly Row[] = [
    { id: "a", name: "Load Balancer 3", region: "us-east", owner: "ops" },
  ];

  export let resizable = true;
  export let sortable = false;
  export let columnWidths: Record<string, number> = {};
  export let onresize: (detail: unknown) => void = () => {};
  export let onclickheader: (detail: unknown) => void = () => {};
</script>

<DataTable
  {headers}
  {rows}
  {resizable}
  {sortable}
  bind:columnWidths
  on:resize={(event) => onresize(event.detail)}
  on:click:header={(event) => onclickheader(event.detail)}
/>

<output data-testid="widths">{JSON.stringify(columnWidths)}</output>
