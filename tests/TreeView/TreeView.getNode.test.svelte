<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";
  import { levelNodes } from "./fixtures";

  /** Spies for the values `getNode` and `getNodes` return. */
  export let onGetNode: (node: unknown) => void = () => {};
  export let onGetNodes: (nodes: unknown) => void = () => {};

  let treeview: TreeView;
  let selectedIds: TreeNode["id"][] = [];
  export let nodes: ComponentProps<TreeView>["nodes"] = levelNodes();
</script>

<TreeView
  bind:this={treeview}
  labelText="getNode Test"
  {nodes}
  bind:selectedIds
  let:node
>
  {node.text}
</TreeView>

<Button data-testid="get-node" on:click={() => onGetNode(treeview.getNode(3))}>
  Get node
</Button>
<Button
  data-testid="get-missing-node"
  on:click={() => onGetNode(treeview.getNode(999))}
>
  Get missing node
</Button>
<Button
  data-testid="get-late-node"
  on:click={() => onGetNode(treeview.getNode("late"))}
>
  Get late node
</Button>
<Button
  data-testid="get-nodes"
  on:click={() => onGetNodes(treeview.getNodes([3, 999, 0]))}
>
  Get nodes
</Button>
