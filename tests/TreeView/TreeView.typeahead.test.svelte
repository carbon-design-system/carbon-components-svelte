<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let nodes: NonNullable<ComponentProps<TreeView>["nodes"]> = [
    { id: 0, text: "Apple" },
    {
      id: 1,
      text: "Banana",
      nodes: [{ id: 2, text: "Boat" }],
    },
    { id: 3, text: "Cherry", disabled: true },
    { id: 4, text: "Cantaloupe" },
    { id: 5, text: "42 Widgets" },
  ];
</script>

<TreeView {nodes} labelText="Type-ahead Test" let:node>
  {node.text}
</TreeView>
