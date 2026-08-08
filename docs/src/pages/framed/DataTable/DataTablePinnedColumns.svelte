<script>
  import { Button, DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name", width: "220px", pinned: "start" },
    { key: "protocol", value: "Protocol", width: "160px" },
    { key: "port", value: "Port", width: "140px" },
    { key: "rule", value: "Rule", width: "200px" },
    { key: "region", value: "Region", width: "180px" },
    { key: "status", value: "Status", width: "160px" },
    { key: "owner", value: "Owner", width: "200px" },
    { key: "updated", value: "Last updated", width: "200px" },
    { key: "actions", value: "Actions", width: "140px", pinned: "end" },
  ];

  const rows = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: i % 3 ? (i % 2 ? 3000 : 80) : 443,
    rule: i % 3 ? "Round robin" : "DNS delegation",
    region: i % 2 ? "us-south" : "eu-de",
    status: i % 4 ? "Active" : "Disabled",
    owner: i % 2 ? "Platform team" : "Networking team",
    updated: `2024-0${(i % 9) + 1}-14`,
  }));
</script>

<div style="overflow-x: auto">
  <DataTable style="min-width: 1600px" {headers} {rows}>
    <svelte:fragment slot="cell" let:cell>
      {#if cell.key === "actions"}
        <Button size="small" kind="ghost">Edit</Button>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</div>
