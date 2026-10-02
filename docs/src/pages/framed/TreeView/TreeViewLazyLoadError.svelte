<script>
  import { InlineLoading, TreeView } from "carbon-components-svelte";

  let treeview = null;
  let nodes = [
    { id: "reports", text: "Reports (fails once)", hasChildren: true },
    { id: "invoices", text: "Invoices", hasChildren: true },
  ];

  const childrenByParentId = {
    reports: [
      { id: "q1", text: "Q1 summary" },
      { id: "q2", text: "Q2 summary" },
    ],
    invoices: [{ id: "inv-1042", text: "Invoice 1042" }],
  };

  let failuresLeft = 1;

  function fetchChildren(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (id === "reports" && failuresLeft > 0) {
          failuresLeft--;
          reject(new Error("Service unavailable"));
        } else {
          resolve(childrenByParentId[id] ?? []);
        }
      }, 1000);
    });
  }

  function updateNode(id, changes) {
    nodes = nodes.map((n) => (n.id === id ? { ...n, ...changes } : n));
  }

  const loadingIds = new Set();

  async function loadChildren(id) {
    const node = treeview?.getNode(id);
    if (!node?.hasChildren || node.nodes || loadingIds.has(id)) return;

    loadingIds.add(id);
    try {
      updateNode(id, { nodes: await fetchChildren(id), error: undefined });
    } catch (error) {
      updateNode(id, { error: error.message });
    } finally {
      loadingIds.delete(id);
    }
  }

  function handleToggleChange({ detail }) {
    // Collapsing a failed branch clears the error, so expanding it retries.
    for (const id of detail.removed) {
      if (treeview?.getNode(id)?.error) updateNode(id, { error: undefined });
    }
    detail.added.forEach(loadChildren);
  }
</script>

<TreeView
  bind:this={treeview}
  labelText="Documents"
  {nodes}
  on:toggle:change={handleToggleChange}
  let:node
>
  {node.text}
  <svelte:fragment slot="childNodes" let:node>
    {#if node.error}
      <InlineLoading
        status="error"
        description="{node.error}. Collapse and expand to retry."
      />
    {:else}
      <InlineLoading status="active" description="Loading {node.text}…" />
    {/if}
  </svelte:fragment>
</TreeView>
