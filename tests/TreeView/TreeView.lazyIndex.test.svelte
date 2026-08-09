<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  export let totalRoots = 20;
  export let childrenPerRoot = 3;
  export let showNodeId: TreeNode["id"] = 3;

  function buildTree(roots: number, children: number): TreeNode[] {
    const nodes: TreeNode[] = [];
    let nextId = 0;
    for (let r = 0; r < roots; r++) {
      const id = nextId++;
      const childNodes: TreeNode[] = [];
      for (let c = 0; c < children; c++) {
        childNodes.push({ id: nextId++, text: `R${r}-C${c}` });
      }
      nodes.push({ id, text: `Root ${r}`, nodes: childNodes });
    }
    return nodes;
  }

  let treeview: TreeView | undefined = undefined;
  let activeId: TreeNode["id"] | undefined = undefined;
  let selectedIds: TreeNode["id"][] = [];
  let expandedIds: TreeNode["id"][] = [];
  $: nodes = buildTree(totalRoots, childrenPerRoot);
</script>

<TreeView
  bind:this={treeview}
  labelText="Lazy index tree"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  let:node
>
  {node.text}
</TreeView>

<button
  type="button"
  data-testid="show-node"
  on:click={() => treeview?.showNode(showNodeId)}
>
  Show node
</button>

<button
  type="button"
  data-testid="get-node"
  on:click={() => {
    const el = document.querySelector("[data-testid='get-node-result']");
    if (el instanceof HTMLElement) {
      el.dataset.nodeId = String(treeview?.getNode(showNodeId)?.id ?? "");
    }
  }}
>
  Get node
</button>
<span data-testid="get-node-result"></span>

<button
  type="button"
  data-testid="expand-all"
  on:click={() => treeview?.expandAll()}
>
  Expand all
</button>

<span data-testid="expanded-count">{expandedIds.length}</span>
<span data-testid="total-count">{totalRoots * (childrenPerRoot + 1)}</span>
