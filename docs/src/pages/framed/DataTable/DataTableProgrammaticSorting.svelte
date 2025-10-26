<script>
  import { Button, DataTable } from "carbon-components-svelte";

  let sortKey = "port";
  let sortDirection = "ascending";

  $: console.log("sortKey", sortKey);
  $: console.log("sortDirection", sortDirection);
</script>

<div style="margin-bottom: 1rem">
  <Button
    size="sm"
    kind="tertiary"
    disabled={sortKey === "port" && sortDirection === "ascending"}
    on:click={() => {
      sortKey = "port";
      sortDirection = "ascending";
    }}
  >
    Sort "port" in ascending order
  </Button>
  <Button
    size="sm"
    kind="tertiary"
    disabled={sortKey === "name" && sortDirection === "descending"}
    on:click={() => {
      sortKey = "name";
      sortDirection = "descending";
    }}
  >
    Sort "name" in descending order
  </Button>
  <Button
    size="sm"
    kind="ghost"
    on:click={() => {
      sortKey = null;
      sortDirection = "none";
    }}
  >
    Clear sorting
  </Button>
</div>

<DataTable
  sortable
  bind:sortKey
  bind:sortDirection
  headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol", sort: false },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
  rows={[
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
    {
      id: "d",
      name: "Load Balancer 6",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "e",
      name: "Load Balancer 4",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "f",
      name: "Load Balancer 5",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ]}
/>
