<script>
  import { DataTable } from "carbon-components-svelte";
</script>

<DataTable
  sortable
  title="Load balancers"
  sort={(a, b, { key }) => {
    switch (key) {
      case "expireDate":
        return new Date(a) - new Date(b);
      case "port":
        return a - b;
      default:
        return String(a).localeCompare(String(b));
    }
  }}
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    {
      key: "expireDate",
      value: "Expire date",
      display: (date) => new Date(date).toLocaleDateString(),
    },
  ]}
  rows={[
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      expireDate: "2020-10-21",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      expireDate: "2020-09-10",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      expireDate: "2020-11-24",
    },
    {
      id: "d",
      name: "Load Balancer 6",
      protocol: "HTTP",
      port: 3000,
      expireDate: "2020-12-01",
    },
    {
      id: "e",
      name: "Load Balancer 4",
      protocol: "HTTP",
      port: 443,
      expireDate: "2021-03-21",
    },
    {
      id: "f",
      name: "Load Balancer 5",
      protocol: "HTTP",
      port: 80,
      expireDate: "2020-11-14",
    },
  ]}
/>
