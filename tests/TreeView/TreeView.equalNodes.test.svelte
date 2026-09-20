<svelte:options accessors />

<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
  export let selectionMode: ComponentProps<TreeView>["selectionMode"] =
    "highlight";
  export let checkedIds: ComponentProps<TreeView>["checkedIds"] = [];
  export let indeterminateIds: ComponentProps<TreeView>["indeterminateIds"] =
    [];
  export let virtualize: ComponentProps<TreeView>["virtualize"] = undefined;
  export let expandedIds: ComponentProps<TreeView>["expandedIds"] = [];
</script>

<TreeView
  labelText="Equal nodes probe"
  {nodes}
  {selectionMode}
  {virtualize}
  bind:checkedIds
  bind:indeterminateIds
  bind:expandedIds
/>
