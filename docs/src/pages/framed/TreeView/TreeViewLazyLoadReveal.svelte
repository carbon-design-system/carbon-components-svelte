<script>
  import { Button, Stack, TreeView } from "carbon-components-svelte";
  import { tick } from "svelte";

  let treeview = null;
  let nodes = [
    { id: "ai", text: "AI / Machine learning", hasChildren: true },
    { id: "analytics", text: "Analytics", hasChildren: true },
  ];

  const childrenByParentId = {
    ai: [{ id: "watson-studio", text: "Watson Studio" }],
    analytics: [
      { id: "engine", text: "IBM Analytics Engine", hasChildren: true },
      { id: "sql-query", text: "IBM Cloud SQL Query" },
    ],
    engine: [
      { id: "spark", text: "Apache Spark" },
      { id: "hadoop", text: "Hadoop" },
    ],
  };

  // The tree can't know where an unloaded node lives, so the app supplies
  // the path, for example from a search API.
  const ancestorIdsById = { spark: ["analytics", "engine"] };

  function fetchChildren(id) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(childrenByParentId[id] ?? []), 500);
    });
  }

  function withChildren(list, id, children) {
    return list.map((n) => {
      if (n.id === id) return { ...n, nodes: children };
      if (n.nodes) return { ...n, nodes: withChildren(n.nodes, id, children) };
      return n;
    });
  }

  // In-flight requests by id, so callers can await one already running.
  const requests = new Map();

  function loadChildren(id) {
    const node = treeview?.getNode(id);
    if (!node?.hasChildren || node.nodes) return Promise.resolve();
    if (!requests.has(id)) {
      const request = fetchChildren(id).then(async (children) => {
        nodes = withChildren(nodes, id, children);
        requests.delete(id);
        // Let the tree index the new nodes before the next lookup.
        await tick();
      });
      requests.set(id, request);
    }
    return requests.get(id);
  }

  // Load each ancestor in order; a child is only known once its parent loads.
  async function loadPath([ancestorId, ...rest]) {
    if (ancestorId === undefined) return;
    await loadChildren(ancestorId);
    await loadPath(rest);
  }

  async function reveal(id) {
    await loadPath(ancestorIdsById[id] ?? []);
    await treeview?.showNode(id);
  }
</script>

<Stack gap={6}>
  <div>
    <Button size="small" on:click={() => reveal("spark")}>
      Show Apache Spark
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
      <svelte:fragment slot="childNodes">Loading…</svelte:fragment>
    </TreeView>
  </div>
</Stack>
