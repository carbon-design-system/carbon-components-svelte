<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<TreeView>["nodes"] = [
    { id: 0, text: "Node 1" },
    { id: 1, text: "Node 2" },
  ];
  export let size: ComponentProps<TreeView>["size"] = "default";
  export let labelText: ComponentProps<TreeView>["labelText"] = "";
  export let hideLabel: ComponentProps<TreeView>["hideLabel"] = false;
  export let activeId: ComponentProps<TreeView>["activeId"] = "";
  export let selectedIds: ComponentProps<TreeView>["selectedIds"] = [];
  export let expandedIds: ComponentProps<TreeView>["expandedIds"] = [];
</script>

<TreeView
  {nodes}
  {size}
  {labelText}
  {hideLabel}
  {activeId}
  {selectedIds}
  {expandedIds}
/>

