<script>
  import { Button, DataTable, EmptyState } from "carbon-components-svelte";
  import Deploy from "carbon-icons-svelte/lib/Deploy.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "status", value: "Status" },
  ];
  const sizes = ["compact", "short", "medium", undefined, "tall"];
</script>

{#each sizes as size}
  <div data-testid="empty-{size ?? 'default'}">
    <DataTable {headers} rows={[]} {size}>
      <EmptyState
        slot="empty"
        size="sm"
        title="Start by adding a deployment"
        subtitle="Deployments you create show up here."
      >
        <Deploy slot="illustration" />
        <Button size="small">Create deployment</Button>
      </EmptyState>
    </DataTable>
  </div>
{/each}
