<script lang="ts">
  import {
    Button,
    DataTable,
    EmptyState,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import Deploy from "carbon-icons-svelte/lib/Deploy.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "status", value: "Status" },
  ] as const;
  const rows = [
    { id: "a", name: "api-gateway", status: "Running" },
    { id: "b", name: "auth", status: "Stopped" },
  ];
  const noRows: typeof rows = [];
  const sizes = ["compact", "short", "medium", undefined, "tall"] as const;
</script>

<div data-testid="empty-text">
  <DataTable {headers} rows={noRows} emptyText="No data" />
</div>

<div data-testid="no-results-text">
  <DataTable {headers} {rows}>
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows value="zzz" />
      </ToolbarContent>
    </Toolbar>
  </DataTable>
</div>

{#each sizes as size}
  <div data-testid="empty-{size ?? 'default'}">
    <DataTable {headers} rows={noRows} {size}>
      <EmptyState
        slot="empty"
        size="sm"
        titleText="Start by adding a deployment"
        subtitleText="Deployments you create show up here."
      >
        <Deploy slot="illustration" size={32} />
        <Button size="small">Create deployment</Button>
      </EmptyState>
    </DataTable>
  </div>
{/each}
