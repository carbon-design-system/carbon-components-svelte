<script lang="ts">
  import Table from "carbon-components-svelte/Table/Table.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<Table>["size"] = undefined;
  export let headers: ComponentProps<Table>["headers"] = [
    { key: "name", value: "Name", rowHeader: true },
    { key: "role", value: "Role" },
    { key: "status", value: "Status", columnAlign: "center" },
  ];

  const rows: ComponentProps<Table>["rows"] = [
    { id: "a", name: "Alice", role: "Engineer", status: "Active" },
    { id: "b", name: "Bob", role: "Designer", status: "Inactive" },
  ];
</script>

<Table {headers} {rows} {size}>
  <svelte:fragment slot="cellHeader" let:header>
    {#if header.key === "name"}
      <span data-testid="custom-header-name">{header.value}</span>
    {:else}
      {header.value}
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="cell" let:row let:header>
    {#if header.key === "status"}
      <span data-testid="status-{row.id}">{row.status}</span>
    {:else}
      {row[header.key]}
    {/if}
  </svelte:fragment>
</Table>
