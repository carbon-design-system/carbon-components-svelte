<svelte:options accessors />

<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: "a", text: "Folder A", hasChildren: true },
    { id: "b", text: "Folder B", hasChildren: true },
  ];
  export let expandedIds: TreeNode["id"][] = [];
</script>

<TreeView
  {nodes}
  bind:expandedIds
  labelText="Lazy virtual tree"
  virtualize={{ maxVisibleRows: 10 }}
>
  <span slot="childNodes" let:node data-testid="placeholder">
    Loading {node.text} (expanded: {node.expanded}, leaf: {node.leaf})
  </span>
</TreeView>
