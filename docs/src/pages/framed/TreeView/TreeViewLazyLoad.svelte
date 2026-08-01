<script>
  import { InlineLoading, TreeView } from "carbon-components-svelte";

  let nodes = [
    { id: "ai", text: "AI / Machine learning", hasChildren: true },
    { id: "analytics", text: "Analytics", hasChildren: true },
    { id: "blockchain", text: "Blockchain", hasChildren: true },
  ];

  const childrenByParentId = {
    ai: [
      { id: "watson-studio", text: "Watson Studio" },
      { id: "watson-assistant", text: "Watson Assistant" },
    ],
    analytics: [
      { id: "analytics-engine", text: "IBM Analytics Engine" },
      { id: "cloud-sql-query", text: "IBM Cloud SQL Query" },
    ],
    blockchain: [
      { id: "blockchain-platform", text: "IBM Blockchain Platform" },
    ],
  };

  function fetchChildren(id) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(childrenByParentId[id] ?? []), 1000);
    });
  }

  async function handleToggle(event) {
    const node = event.detail;

    // Only fetch once: a node with `hasChildren` but no `nodes` yet.
    if (!node.hasChildren || node.nodes) return;

    const children = await fetchChildren(node.id);

    nodes = nodes.map((n) =>
      n.id === node.id ? { ...n, nodes: children } : n,
    );
  }
</script>

<TreeView
  labelText="Cloud Products (lazy-loaded)"
  {nodes}
  on:toggle={handleToggle}
  let:node
>
  {node.text}
  <svelte:fragment slot="childNodes" let:node>
    <InlineLoading status="active" description="Loading {node.text}…" />
  </svelte:fragment>
</TreeView>
