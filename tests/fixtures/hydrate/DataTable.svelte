<script>
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
  ];
  const rows = [
    { id: "a", name: "Load Balancer 1", protocol: "HTTP", port: 3000 },
    { id: "b", name: "Load Balancer 2", protocol: "HTTP", port: 443 },
    { id: "c", name: "Load Balancer 3", protocol: "HTTP", port: 80 },
  ];
</script>

<DataTable
  title="Load balancers"
  description="Your load balancers"
  {headers}
  {rows}
  {...$$restProps}
/>
