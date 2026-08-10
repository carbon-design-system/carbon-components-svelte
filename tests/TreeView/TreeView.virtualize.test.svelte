<svelte:options accessors />

<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let totalRoots = 500;
  export let childrenPerRoot = 3;

  // Large enough that windowing matters: totalRoots visible rows when collapsed.
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
  export let expandBeforeShowId: TreeNode["id"] = 0;
  export let virtualize: ComponentProps<TreeView>["virtualize"] = {
    maxVisibleRows: 10,
  };
  export let multiselect = false;

  let treeview: TreeView;
  export let activeId: TreeNode["id"] = "";
  export let selectedIds: TreeNode["id"][] = [];
  let expandedIds: TreeNode["id"][] = [];
  let scrollContainerRef: ComponentProps<TreeView>["scrollContainerRef"] = null;
  $: nodes = buildTree(totalRoots, childrenPerRoot);
</script>

<TreeView
  bind:this={treeview}
  bind:scrollContainerRef
  labelText="Virtualized tree"
  {virtualize}
  {multiselect}
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
  data-testid="set-active"
  on:click={() => {
    activeId = showNodeId;
  }}
>
  Set active
</button>

<button
  type="button"
  data-testid="show-node"
  on:click={() => treeview.showNode(showNodeId)}
>
  Show node
</button>

<!-- Mirrors the docs example, without awaiting a flush in between: `showNode`
     runs while the rendered window still reflects the collapsed tree. -->
<button
  type="button"
  data-testid="expand-and-show-node"
  on:click={() => {
    expandedIds = [expandBeforeShowId];
    treeview.showNode(showNodeId);
  }}
>
  Expand and show node
</button>
