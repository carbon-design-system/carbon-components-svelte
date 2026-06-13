<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let totalRoots = 500;
  export let childrenPerRoot = 3;

  // Build a tree large enough to cross the default virtualization threshold.
  // Total node count = totalRoots * (1 + childrenPerRoot). With defaults
  // (500 * 4 = 2,000), well above the threshold of 100.
  function buildTree(roots: number, perRoot: number): TreeNode[] {
    const out: TreeNode[] = [];
    let next = 0;
    for (let r = 0; r < roots; r++) {
      const rootId = next++;
      const children: TreeNode[] = [];
      for (let c = 0; c < perRoot; c++) {
        children.push({ id: next++, text: `root-${rootId}-child-${c}` });
      }
      out.push({ id: rootId, text: `root-${rootId}`, nodes: children });
    }
    return out;
  }

  export let showNodeId: TreeNode["id"] = 0;

  let treeview: TreeView;
  let activeId: TreeNode["id"] | undefined = undefined;
  let selectedIds: TreeNode["id"][] = [];
  let expandedIds: TreeNode["id"][] = [];
  let scrollContainerRef: ComponentProps<TreeView>["scrollContainerRef"] = null;
  $: nodes = buildTree(totalRoots, childrenPerRoot);
</script>

<TreeView
  bind:this={treeview}
  bind:scrollContainerRef
  labelText="Virtualized tree"
  virtualize={{ maxVisibleRows: 10 }}
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
  on:click={() => treeview.showNode(showNodeId)}
>
  Show node
</button>
