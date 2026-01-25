<script lang="ts">
  import { TreeView } from "carbon-components-svelte";
  import type { TreeNode } from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let autoCollapse = true;

  type TreeViewNodeId = TreeNode<string>["id"];

  let treeview: TreeView;
  let activeId: TreeViewNodeId = "";
  let selectedIds: TreeViewNodeId[] = [];
  let expandedIds: TreeViewNodeId[] = [];
  let nodes: ComponentProps<TreeView>["nodes"] = [
    {
      id: "folder1",
      text: "Folder 1",
      nodes: [
        { id: "item1", text: "Item 1" },
        { id: "item2", text: "Item 2" },
      ],
    },
    {
      id: "folder2",
      text: "Folder 2",
      nodes: [
        { id: "item3", text: "Item 3" },
        { id: "item4", text: "Item 4" },
      ],
    },
    {
      id: "folder3",
      text: "Folder 3",
      nodes: [
        {
          id: "subfolder1",
          text: "Subfolder 1",
          nodes: [{ id: "subitem1", text: "Subitem 1" }],
        },
        {
          id: "subfolder2",
          text: "Subfolder 2",
          nodes: [{ id: "subitem2", text: "Subitem 2" }],
        },
      ],
    },
  ];

  $: console.log("expandedIds", expandedIds);
</script>

<TreeView
  bind:this={treeview}
  {autoCollapse}
  labelText="Auto Collapse Test"
  {nodes}
  bind:activeId
  bind:selectedIds
  bind:expandedIds
  on:select={({ detail }) => console.log("select", detail)}
  on:toggle={({ detail }) => console.log("toggle", detail)}
  let:node
>
  {node.text}
</TreeView>
