<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let draggable: ComponentProps<TreeView>["draggable"] = true;

  export let nodes: ComponentProps<TreeView>["nodes"] = [
    {
      id: "analytics",
      text: "Analytics",
      nodes: [
        { id: "engine", text: "Engine" },
        { id: "sql-query", text: "SQL Query" },
      ],
    },
    { id: "blockchain", text: "Blockchain" },
    { id: "disabled-node", text: "Disabled", disabled: true },
  ];

  export let expandedIds: ComponentProps<TreeView>["expandedIds"] = [
    "analytics",
  ];

  /** Spy for the `move` event. */
  export let onMove: (detail: {
    ids: Array<TreeNode["id"]>;
    targetId: TreeNode["id"];
    position: "before" | "after" | "inside";
  }) => void = () => {};
</script>

<TreeView
  {draggable}
  {nodes}
  {expandedIds}
  labelText="Drag Drop Test"
  on:move={({ detail }) => onMove(detail)}
  let:node
>
  {node.text}
</TreeView>
