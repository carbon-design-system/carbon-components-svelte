<script>
  import { TreeViewGrid } from "carbon-components-svelte";

  const headers = [
    { key: "text", value: "Name" },
    {
      key: "instances",
      value: "Instances",
      columnAlign: /** @type {const} */ ("end"),
    },
  ];

  let nodes = [
    { id: "us-east", text: "US East", instances: 14, hasChildren: true },
    { id: "eu-west", text: "EU West", instances: 5, hasChildren: true },
  ];

  // For demo purposes only: stands in for a request.
  async function loadServices(region) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [
      { id: `${region.id}-api`, text: "payments-api", instances: 6 },
      { id: `${region.id}-db`, text: "ledger-db", instances: 8 },
    ];
  }

  async function onToggle({ detail }) {
    if (!detail.expanded || detail.nodes) return;
    const region = nodes.find((node) => node.id === detail.id);
    region.nodes = await loadServices(region);
    nodes = nodes;
  }
</script>

<TreeViewGrid
  labelText="Cloud resources"
  size="short"
  {headers}
  {nodes}
  on:toggle={onToggle}
/>
