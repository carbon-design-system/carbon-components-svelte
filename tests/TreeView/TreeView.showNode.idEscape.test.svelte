<script lang="ts">
  import { Button, TreeView } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  /** Id contains `"`, which breaks a naive `[id="..."]` selector without CSS.escape */
  const targetId = 'node-with-"-char';

  let treeview: TreeView;
  let nodes: ComponentProps<TreeView>["nodes"] = [
    {
      id: "folder",
      text: "Folder",
      nodes: [{ id: targetId, text: "Leaf" }],
    },
  ];
</script>

<TreeView bind:this={treeview} labelText="showNode id escape" {nodes} let:node>
  {node.text}
</TreeView>

<Button
  data-testid="show-special-id"
  on:click={() => treeview.showNode(targetId)}
>
  Show node with special id
</Button>
