<script lang="ts">
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: ComponentProps<TreeView>["nodes"] = [
    {
      id: "root",
      text: "Root",
      nodes: [
        { id: "child", text: "Child" },
        { id: "locked", text: "Locked", editable: false },
      ],
    },
    { id: "leaf", text: "Leaf" },
    { id: "blocked", text: "Blocked", disabled: true },
    { id: "link", text: "Link", href: "#link" },
  ];

  export let virtualize: ComponentProps<TreeView>["virtualize"] = undefined;

  /** Spy for the `rename` event. */
  export let onRename: (detail: {
    id: TreeNode["id"];
    text: string;
    previousText: string;
  }) => void = () => {};

  let treeview: TreeView;

  // Drives the `editNode` accessor from the spec.
  export function edit(id: TreeNode["id"]) {
    treeview.editNode(id);
  }
</script>

<TreeView
  bind:this={treeview}
  labelText="Files"
  editable
  {nodes}
  {virtualize}
  on:rename={({ detail }) => onRename(detail)}
/>
