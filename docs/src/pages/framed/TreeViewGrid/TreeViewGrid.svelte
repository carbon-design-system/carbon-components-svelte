<script>
  import { TreeViewGrid } from "carbon-components-svelte";

  const headers = [
    { key: "text", value: "Name" },
    { key: "status", value: "Status" },
    { key: "owner", value: "Owner" },
  ];

  const nodes = [
    {
      id: "us-east",
      text: "US East",
      status: "Active",
      owner: "Platform",
      nodes: [
        {
          id: "us-east-api",
          text: "payments-api",
          status: "Active",
          owner: "Payments",
          nodes: [
            {
              id: "us-east-api-1",
              text: "payments-api-1",
              status: "Active",
              owner: "Payments",
            },
            {
              id: "us-east-api-2",
              text: "payments-api-2",
              status: "Degraded",
              owner: "Payments",
            },
          ],
        },
        {
          id: "us-east-db",
          text: "ledger-db",
          status: "Active",
          owner: "Data",
        },
      ],
    },
    {
      id: "eu-west",
      text: "EU West",
      status: "Degraded",
      owner: "Platform",
      nodes: [
        {
          id: "eu-west-api",
          text: "payments-api",
          status: "Degraded",
          owner: "Payments",
        },
      ],
    },
    { id: "ap-south", text: "AP South", status: "Stopped", owner: "Growth" },
  ];
</script>

<TreeViewGrid
  labelText="Cloud resources"
  size="short"
  {headers}
  {nodes}
  expandedIds={["us-east"]}
/>
