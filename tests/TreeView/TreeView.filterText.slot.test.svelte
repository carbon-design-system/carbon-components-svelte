<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let filterText: ComponentProps<TreeView>["filterText"] = "";

  const nodes: ComponentProps<TreeView>["nodes"] = [
    {
      id: "1",
      text: "Analytics",
      nodes: [
        {
          id: "1-1",
          text: "Engines",
          nodes: [{ id: "1-1-1", text: "Apache Spark" }],
        },
      ],
    },
  ];
</script>

<TreeView labelText="Cloud Products" {nodes} {filterText} let:node>
  <span
    data-testid="label-{node.id}"
    data-match={node.match === null ? "none" : node.match.join(",")}
  >
    {node.text}
  </span>
</TreeView>
