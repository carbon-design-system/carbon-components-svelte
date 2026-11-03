<script>
  import { DataTable, Tag } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "status", value: "Status" },
  ];

  const rows = [
    { id: "a", name: "Load Balancer 1", status: "Active" },
    { id: "b", name: "Load Balancer 2", status: "Idle" },
  ];

  const sizes = ["compact", "short", "medium", undefined, "tall"];
</script>

{#each sizes as size}
  <div data-testid={size ?? "default"}>
    <DataTable {size} {headers} {rows}>
      <svelte:fragment slot="cell" let:cell>
        {#if cell.key === "status"}
          <Tag size="sm" type="green">{cell.value}</Tag>
        {:else}
          {cell.value}
        {/if}
      </svelte:fragment>
    </DataTable>
  </div>
{/each}
