<script>
  import {
    Button,
    InlineLoading,
    Stack,
    TreeView,
  } from "carbon-components-svelte";

  let treeview = null;
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

  // Ids with a request in flight, so repeated expansion doesn't refetch.
  const loadingIds = new Set();

  async function loadChildren(id) {
    const node = treeview?.getNode(id);
    // Only fetch once: a node with `hasChildren` but no `nodes` yet.
    if (!node?.hasChildren || node.nodes || loadingIds.has(id)) return;

    loadingIds.add(id);
    const children = await fetchChildren(id);
    loadingIds.delete(id);

    nodes = nodes.map((n) => (n.id === id ? { ...n, nodes: children } : n));
  }
</script>

<Stack gap={6}>
  <div>
    <Button kind="tertiary" size="small" on:click={() => treeview?.expandAll()}>
      Expand all
    </Button>
  </div>
  <div>
    <TreeView
      bind:this={treeview}
      labelText="Cloud Products (lazy-loaded)"
      {nodes}
      on:toggle:change={({ detail }) => detail.added.forEach(loadChildren)}
      let:node
    >
      {node.text}
      <svelte:fragment slot="childNodes" let:node>
        <InlineLoading status="active" description="Loading {node.text}…" />
      </svelte:fragment>
    </TreeView>
  </div>
</Stack>
