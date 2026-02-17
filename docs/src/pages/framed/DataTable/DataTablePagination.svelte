<script>
  import { DataTable, Pagination } from "carbon-components-svelte";

  let rows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    protocol: "HTTP",
    port: 3000 + i * 10,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));
  let pageSize = 5;
  let page = 1;
</script>

<DataTable
  sortable
  title="Load balancers"
  description="Your organization's active load balancers."
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  {pageSize}
  {page}
  {rows}
/>
<Pagination
  bind:pageSize
  bind:page
  totalItems={rows.length}
  pageSizeInputDisabled
/>
