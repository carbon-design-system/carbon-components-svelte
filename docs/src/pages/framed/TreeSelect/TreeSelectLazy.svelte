<script>
  import { TreeSelect } from "carbon-components-svelte";

  const nodes = [
    { id: "accounts", text: "Cloud accounts", hasChildren: true },
    { id: "clusters", text: "Clusters", hasChildren: true },
    { id: "edge", text: "Edge locations" },
  ];

  let attempts = 0;

  async function loadChildren(node) {
    // For demo purposes only: simulates a network request.
    await new Promise((resolve) => setTimeout(resolve, 600));
    attempts += 1;
    if (node.id === "clusters" && attempts % 2 === 1) {
      throw new Error("Could not reach the server");
    }
    return [1, 2, 3].map((n) => ({
      id: `${node.id}-${n}`,
      text: `${node.text} ${n}`,
      hasChildren: n === 1 && !node.id.includes("-"),
    }));
  }
</script>

<TreeSelect
  labelText="Resource"
  label="Choose a resource"
  helperText="Expand a node to load its children. Clusters fails on its first try."
  {nodes}
  {loadChildren}
/>
