<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "port", value: "Port" },
  ] as const;

  const rows = [
    { id: "a", name: "Load Balancer 1", port: 3000 },
    { id: "b", name: "Load Balancer 2", port: 443 },
  ];
</script>

<DataTable {headers} {rows} expandable expandedRowIds={["b"]}>
  {#snippet cellHeader({ header })}
    <span data-testid="header-slot">{header.key}={header.value}</span>
  {/snippet}
  {#snippet cell({ cell, row })}
    <span data-testid="cell-slot">{row.id}.{cell.key}={cell.value}</span>
  {/snippet}
  {#snippet expandedRow({ row })}
    <span data-testid="expanded-slot">{row.id}={row.name}</span>
  {/snippet}
</DataTable>
