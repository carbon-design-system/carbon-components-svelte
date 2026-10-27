<script>
  import { Link, Tag, TreeViewGrid } from "carbon-components-svelte";

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const headers = [
    { key: "text", value: "Name" },
    { key: "status", value: "Status" },
    { key: "owner", value: "Owner" },
    {
      key: "cost",
      value: "Monthly cost",
      columnAlign: /** @type {const} */ ("end"),
      display: (value) => money.format(value),
    },
  ];

  const kinds = { Active: "green", Degraded: "red", Stopped: "gray" };

  const nodes = [
    {
      id: "us-east",
      text: "US East",
      status: "Active",
      owner: "Platform",
      cost: 18240.5,
      nodes: [
        {
          id: "us-east-api",
          text: "payments-api",
          status: "Active",
          owner: "Payments",
          cost: 6400,
        },
        {
          id: "us-east-db",
          text: "ledger-db",
          status: "Degraded",
          owner: "Data",
          cost: 11840.5,
        },
      ],
    },
    {
      id: "ap-south",
      text: "AP South",
      status: "Stopped",
      owner: "Growth",
      cost: 0,
    },
  ];
</script>

<TreeViewGrid
  labelText="Cloud resources"
  size="short"
  {headers}
  {nodes}
  expandedIds={["us-east"]}
>
  <svelte:fragment slot="cell" let:node let:cell>
    {#if cell.key === "status"}
      <Tag size="sm" type={kinds[node.status]}>{node.status}</Tag>
    {:else if cell.key === "owner"}
      <Link href="#{node.owner}">{node.owner}</Link>
    {:else}
      {cell.display ? cell.display(cell.value, node) : cell.value}
    {/if}
  </svelte:fragment>
</TreeViewGrid>
