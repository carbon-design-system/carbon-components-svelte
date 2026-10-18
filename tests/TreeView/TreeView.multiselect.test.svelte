<svelte:options accessors />

<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";
  import { cloudProducts } from "./fixtures";

  /** Spies for the per-node `select`, `toggle` and `focus` events. */
  export let onSelect: (detail: unknown) => void = () => {};
  export let onToggle: (detail: unknown) => void = () => {};
  export let onFocus: (detail: unknown) => void = () => {};

  export let multiselect: ComponentProps<TreeView>["multiselect"] = true;
  export let multiselectMode: ComponentProps<TreeView>["multiselectMode"] =
    "node";
  export let activeId: ComponentProps<TreeView>["activeId"] = 0;
  export let selectedIds: ComponentProps<TreeView>["selectedIds"] = [0, 7, 9];
  export let expandedIds: ComponentProps<TreeView>["expandedIds"] = [];
  export let nodes: NonNullable<ComponentProps<TreeView>["nodes"]> =
    cloudProducts();
</script>

<TreeView
  labelText="Cloud Products"
  {multiselect}
  {multiselectMode}
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  on:select={({ detail }) => onSelect(detail)}
  on:toggle={({ detail }) => onToggle(detail)}
  on:focus={({ detail }) => onFocus(detail)}
/>
