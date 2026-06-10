<svelte:options accessors />

<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let activeId: string | number = "";
  export let selectedIds: (string | number)[] = [];
  export let size: ComponentProps<TreeView>["size"] = "compact";

  const nodes: ComponentProps<TreeView>["nodes"] = [
    { id: 1, text: "Node 1" },
    { id: 2, text: "Node 2" },
  ];
</script>

<TreeView
  {size}
  labelText="Regression"
  {nodes}
  bind:activeId
  bind:selectedIds
  let:node
>
  {node.text}
</TreeView>
