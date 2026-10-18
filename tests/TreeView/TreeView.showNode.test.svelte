<svelte:options accessors />

<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";
  import { levelNodes } from "./fixtures";

  let treeview: TreeView;
  export let activeId: TreeNode["id"] | undefined = undefined;
  export let selectedIds: TreeNode["id"][] = [];
  export let expandedIds: TreeNode["id"][] = [];
  const nodes: ComponentProps<TreeView>["nodes"] = levelNodes();
</script>

<TreeView
  bind:this={treeview}
  labelText="showNode Test"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  let:node
>
  {node.text}
</TreeView>

<Button data-testid="show-default" on:click={() => treeview.showNode(3)}>
  Show node (default)
</Button>
<Button
  data-testid="expand-only"
  on:click={() => treeview.showNode(3, { select: false, focus: false })}
>
  Expand only
</Button>
<Button
  data-testid="select-only"
  on:click={() => treeview.showNode(3, { expand: false, focus: false })}
>
  Select only
</Button>
<Button
  data-testid="focus-only"
  on:click={() => treeview.showNode(3, { expand: false, select: false })}
>
  Focus only
</Button>
