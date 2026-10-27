<script>
  import { TreeViewGrid } from "carbon-components-svelte";

  const headers = [
    { key: "text", value: "Name" },
    {
      key: "instances",
      value: "Instances",
      width: "8rem",
      columnAlign: /** @type {const} */ ("end"),
    },
    {
      key: "cost",
      value: "Monthly cost",
      width: "10rem",
      columnAlign: /** @type {const} */ ("end"),
    },
  ];

  const nodes = [
    {
      id: "us-east",
      text: "US East",
      instances: 14,
      cost: 18240.5,
      nodes: [
        { id: "us-east-api", text: "payments-api", instances: 6, cost: 6400 },
        { id: "us-east-db", text: "ledger-db", instances: 8, cost: 11840.5 },
      ],
    },
    { id: "eu-west", text: "EU West", instances: 5, cost: 9400 },
  ];
</script>

<TreeViewGrid
  labelText="Cloud resources"
  size="short"
  {headers}
  {nodes}
  expandedIds={["us-east"]}
/>
