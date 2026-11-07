<script>
  import { DataGrid, Tag } from "carbon-components-svelte";

  const columns = [
    { key: "service", title: "Service", width: 170 },
    { key: "status", title: "Status", width: 140 },
    { key: "uptime", title: "Uptime", width: 120, align: "end" },
    { key: "deployed", title: "Last deploy", width: 160 },
  ];

  const rows = [
    {
      service: "billing-api",
      status: "Healthy",
      uptime: 99.98,
      deployed: "2025-03-04",
    },
    {
      service: "checkout",
      status: "Degraded",
      uptime: 99.12,
      deployed: "2025-03-06",
    },
    {
      service: "identity",
      status: "Healthy",
      uptime: 99.99,
      deployed: "2025-02-27",
    },
    {
      service: "inventory",
      status: "Down",
      uptime: 94.7,
      deployed: "2025-03-07",
    },
    {
      service: "search",
      status: "Healthy",
      uptime: 99.95,
      deployed: "2025-03-01",
    },
  ];

  const kinds = { Healthy: "green", Degraded: "warm-gray", Down: "red" };
</script>

<DataGrid labelText="Service status" {columns} {rows}>
  <svelte:fragment slot="cell" let:column let:value>
    {#if column.key === "status"}
      <Tag size="sm" type={kinds[value]}>{value}</Tag>
    {:else if column.key === "uptime"}
      {value.toFixed(2)}%
    {:else}
      {value}
    {/if}
  </svelte:fragment>
</DataGrid>
