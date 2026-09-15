<script>
  import { DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = [
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];

  const targetHeaders = [
    { key: "instance", value: "Instance" },
    { key: "status", value: "Status" },
  ];

  const targetsByLoadBalancerId = {
    a: [
      { id: "a-1", instance: "web-01", status: "Healthy" },
      { id: "a-2", instance: "web-02", status: "Healthy" },
    ],
    b: [
      { id: "b-1", instance: "web-03", status: "Healthy" },
      { id: "b-2", instance: "web-04", status: "Degraded" },
    ],
    c: [{ id: "c-1", instance: "web-05", status: "Healthy" }],
  };
</script>

<DataTable expandable {headers} {rows}>
  <svelte:fragment slot="expandedRow" let:row>
    <DataTable
      size="compact"
      headers={targetHeaders}
      rows={targetsByLoadBalancerId[row.id]}
    />
  </svelte:fragment>
</DataTable>
