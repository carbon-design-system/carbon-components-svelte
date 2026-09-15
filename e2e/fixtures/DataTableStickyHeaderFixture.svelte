<script>
  import { DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "region", value: "Region" },
    { key: "service", value: "Service" },
    { key: "environment", value: "Environment" },
    { key: "status", value: "Status" },
    { key: "owner", value: "Owner" },
    { key: "lastDeploy", value: "Last deploy" },
    { key: "incidents", value: "Incidents" },
  ];

  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: `row-${i}`,
    region: "us-east-1",
    service: `payments-api-${i}`,
    environment: "production",
    status: "Healthy",
    owner: "platform-team",
    lastDeploy: "2026-09-01",
    incidents: 0,
  }));
</script>

<div data-testid="data-table-sticky-root" style="width: 400px;">
  <DataTable {headers} {rows} stickyHeader stickyHeaderMaxHeight={200} />
</div>
